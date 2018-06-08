const Koa = require('koa');
const Router = require('koa-router');
const multer = require('koa-multer');
const serve = require('koa-static');
const path = require('path')
const render = require('./lib/render')
const NLPCall = require('./lib/NLP')
const dataProcessing = require('./lib/dataProcessing')
const entityCleaning = require('./lib/entityCleaning')

const app = module.exports = new Koa();
const upload = multer({ dest: 'uploads/' });

app.use(async function(ctx, next) {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  await ctx.render('404');
});

app.use(serve(path.join(__dirname, '/public')));
app.use(render);

const mainRouter = new Router()
let entities = null

mainRouter.get('/', async ctx => {
  await ctx.render('index');
})

mainRouter.get('/display', async ctx => {
  await ctx.render('display', {entities: entities});
})

mainRouter.post('/upload', upload.single('file'), async ctx => {
  const { file } = ctx.req
  const rawData = await dataProcessing(file.path)
  const rawEntities = await NLPCall(rawData.cleanSplit.join(', '))
  entities = entityCleaning(rawEntities)
  ctx.redirect('/display');
});

app.use(mainRouter.routes())
app.use(mainRouter.allowedMethods())

app.listen(3000);
