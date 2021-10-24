import { dirname, join } from "path";
import { promisify } from "util";
import { promises, createReadStream, createWriteStream } from "fs";
import { pipeline, Transform } from "stream";
const pipelineAsync = promisify(pipeline)
const { readdir } = promises;

import csvtojson from 'csvtojson'
import jsontocsv from 'json-to-csv-stream'
import StreamConcat from 'stream-concat'

import debug from "debug";
const log = debug("app:concat");

const { pathname: currentFile } = new URL(import.meta.url);

const cwd = dirname(currentFile).replace("/C:", "");
const filesDir = `${cwd}/dataset`;
const output = `${cwd}/final.csv`;

console.time("concat-data");
const files = (await readdir(filesDir)).filter(
  (item) => !!!~item.indexOf(".zip")
);

log(`processing ${files}`);
const ONE_SECOND = 1000;

setInterval(() => process.stdout.write("."), ONE_SECOND).unref();

const streams = files.map(
    item=>createReadStream(join(filesDir, item))
)
const combinedStreams = new StreamConcat(streams)
const finalStram = createWriteStream(output)
const handleStream = new Transform({
    transform: (chunk, enconding, cb) =>{
        const data = JSON.parse(chunk)
        const output =  {
            id: data.Respondent,
            country: data.Country
        }
       //log(`id: ${output.id}`)
        return cb(null, JSON.stringify(output))
    }
})

await pipelineAsync(
    combinedStreams,
    csvtojson(),
    handleStream,
    jsontocsv(),
     finalStram
)

log(`${files.length} files merged! on ${output}`);
console.timeEnd('concat-data')