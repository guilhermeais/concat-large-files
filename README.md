# concat-large-files
## Aprendendo a usar NodeJS Streams para manipular grandes arquivos.
<hr/>
<h3>Há alguns dias, estive com dificuldades para entender como funciona a manipulação de arquivos com NodeJS Streams, logo, com videos do Erick Wendel, tive um ótimo contato com as NodeJS Streams, nesse reposítorio, por exemplo, concatenei 2 arquivos grandes em CSV, e não só concatenei eles, como fiz alguns manipulações.</h3>

Tudo isso, foi feito usando as NodeJS Streams, usando o que chamamos de <b>Pipeline</b>, que traz a ideia de um filtro, por exemplo. Basicamente, o nosso arquivo entra na pipeline, e passa pelas streams, as Streams, que eu conheci até agora, são essas 3: 
<ul>
<li>
  <h4>Readable Stream</h4> <small> É uma fonte de dados, seja um banco de dados, uma requisição  (como o request do HTTP), qualquer fonte de dados... O papel dela na pipeline é fornercer os "pedacinhos"/"chunks" de algum dado, para que possamos, mapea-los ou escreve-los.</small>
</li>

<li>
  <h4>Transform Stream</h4> <small>Ela recebe os dados que a Readable Stream fornece pelo callback. Aqui, nós podemos mapear os dados, fazer alguma manipulação. E depois, nós passamos o dado para frente, usando callback, para que nós fazemos mais alguma manipulação com outra Transform Stream, ou, vamos direto para a Writable Stream. </small>
</li>

<li>
  <h4>Writable Stream</h4> <small>E aqui é o ultimo passo da nosssa pipeline, é a saída do dado após ter sido lido de alguma fonte de dados e mapeado(opcional). A saída, pode ser em um console.log(), um arquivo, um site, um banco de dados, um response do HTTP... Qualquer lugar que vamos enviar a informação. </small>
</li>
</ul>
 
 <hr/>
 <h2> Exemplo na prática</h2>
 <h4> O NodeJS tem um módulo nativo chamado "stream", no qual no disponibiliza classes como a Readable, Writable e Transform, nos quais podemos implementar e criar nossas proprias Streams. E é isso que iremos fazer agora... </h4>
 
 ```javascript
import { pipeline, Readable, Writable, Transform } from "stream";
import { createWriteStream } from 'fs'
import { promisify } from "util";
const pipelineAsync = promisify(pipeline); // transformamos o pipeline em uma Promise para não precisarmos trabalhar com callbacks

// Vamos começar, implementando a Readable. Lembre-se que a Readable é uma fonte de dados nos fornecendo dados sobre demanda, no caso, vamos fornecer um JSON de pessoas.
 const readableStram = Readable({
    read() {
      for (let i = 0; i < 1e5; i++) {
      
        const person = { id: i, name: `Guilherme-${i}\n`};
        const data = JSON.stringify(person);
        this.push(data); // aqui, enviamos o chunk pra frente, seja para o transform, seja para o write
      }
      // avisa que acabaram os dados.
      this.push(null);
    },
  });

// Agora, vamos implementar a Transform, que é responsável pelo mapeamento de dados passados por alguma Readable Stream
// A nossa primeira Transform, irá mapear os dados de JSON para CSV
 const writableMapToCSV = Transform({
    transform(chunk, enconding, cb) {
      // chunk é cada dado que a readable da um push
      const data = JSON.parse(chunk);
      const result = `${data.id},${data.name.toUpperCase()}\n`;

      cb(null, result); // passamos o dado pra frente chamando o callback.
    },
  });

// Depois, vamos fazer outro Transform, que irá setar o Header do nosso CSV
 const setHeader = Transform({
    transform(chunk, enconding, cb) {
      this.counter = this.counter ?? 0;
      if (this.counter) {
        return cb(null, chunk);
      }
      this.counter += 1;

      cb(null, "id,name\n".concat(chunk)); // concatemos id,name com o nosso dado, eles ficam no topo do CSV para representar as colunas.
    },
  });

// Agora, vamos chamar o pipeline, que irá executar todo o processo, com aquela ideia de "cano" ou "fluxo" que o dado irá passar.
// E detalhe, nós não vamos criar nossa propria Writable, vamos usar o módulo nativo do NodeJS, o 'fs', para criar uma WriteStream e ele irá criar o arquivo .csv para nós

  await pipelineAsync(
    readableStram, // Primeiro, recebemos os dados
    writableMapToCSV, // Depois, transformamos ele em CSV
    setHeader, // Depois, setamos os headers dele
    createWriteStream('my.csv') // e finalmente, escrevemos ele.
  );
```

<h3>
  Bom, agradeço a qualquer um que tenha visto até aqui e espero que de alguma forma isso tenha ajudado alguém :). Fiz esse README, com a intenção de expor o que eu aprendi e realmente ver se absorvi bem o conhecimento, acho que a melhor maneira de aprender é ensinar.
</h3>
