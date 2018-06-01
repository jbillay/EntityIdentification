const Koa = require('koa');
const Router = require('koa-router');
const multer = require('koa-multer');
const serve = require('koa-static');
const path = require('path')
const tika = require('tika')
const splitSentence = require('sentence-splitter')
const language = require('@google-cloud/language').v1beta2
const client = new language.LanguageServiceClient()
const _ = require('lodash')

const app = new Koa();
const upload = multer({ dest: 'uploads/' });

app.use(async function(ctx, next) {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  ctx.redirect('/404.html');
});

app.use(serve(path.join(__dirname, '/public')));

const uploadRouter = new Router()

const NLPCall = async function (text) {
  return new Promise((resolve, reject) => {
    const document = {
      content: text,
      type: 'PLAIN_TEXT'
    }
    client
        .analyzeEntities({document: document})
        .then(results => {
          const entities = results[0].entities;
          resolve(entities)
        })
        .catch(err => {
          reject(err)
        })
  });
};

const cleanSentences = function (text) {
  let dictionary = []
  let globalSize = 0

  const split = splitSentence.split(text)
  split.forEach(function (element) {
    if (element.type === 'Sentence') {
      element.children.forEach(function (children) {
        if (children.type === 'Str') {
          dictionary.push(children.raw)
          globalSize += children.raw.length
        }
      })
    }
  })
  return dictionary
};

const buildDict = async function (filePath) {
  return new Promise((resolve, reject) => {
    const options = { contentType: 'application/pdf' }
    tika.extract(filePath, options, function(err, text, meta) {
      if (err) reject(err)
      const cleanSplit = cleanSentences(text)
      const info = { text, meta, cleanSplit }
      resolve(info)
    });
  });
};

const entitiesCleaner = function (entities) {
  let cleanEntities = _.map(entities, function (entity) {
    if (entity.type === 'PERSON') {
      let wikipedia = null
      if (entity.metadata.wikipedia_url) {
        wikipedia = entity.metadata.wikipedia_url
      }
      return {"name": entity.name, "wikipedia": wikipedia}
    }
  })
  cleanEntities.filter(n => n)
  cleanEntities = _.uniqBy(cleanEntities, 'name');
  return cleanEntities
}

uploadRouter.post('/upload', upload.single('file'), async ctx => {
  const { file } = ctx.req
  const info = await buildDict(file.path)
  const entities = await NLPCall(info.cleanSplit.join(', '))
  const cleanedEntities = entitiesCleaner(entities)
  ctx.status = 200
  ctx.body = cleanedEntities
});

app.use(uploadRouter.routes())
app.use(uploadRouter.allowedMethods())

app.listen(3000);

//
// const cheerio = require('cheerio')
// const algoliasearch = require('algoliasearch')
//
// const options = { contentType: 'application/pdf' }
//
// const splitHtmlByPages = function (content) {
//   let pages = []
//   const $ = cheerio.load(content)
//   $('div.page').each(function(i, elm) {
//     pages.push({page: $(this).html()})
//   })
//   return pages;
// }
//
// tika.xhtml('./test.pdf', options, function(err, html) {
//   const pdfSplitContent = splitHtmlByPages(html)
//   const client = algoliasearch('VRU1HBI24B', '9b5cda006188ef993b067e9b6264a403');
//   const index = client.initIndex('searchProspectus');
//   index.clearIndex(function (err, content) {
//     if (err) throw err;
//     index.waitTask(content.taskID, function(err) {
//       if (!err) {
//         index.addObjects(pdfSplitContent, function(err, content) {
//           if (err) throw err;
//           index.waitTask(content.taskID, function(err) {
//             if (!err) {
//               index.search({ query: 'ISIN codes'}, function searchDone(err, content) {
//                 if (err) throw err;
//                 console.log(content.hits);
//               })
//             }
//           })
//         })
//       }
//     })
//   })
// });
