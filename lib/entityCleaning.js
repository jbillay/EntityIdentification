const _ = require('lodash')

module.exports = function (entities) {
  let cleanEntities = _.map(entities, function (entity) {
    if (entity.type === 'PERSON') {
      let wikipedia = null
      if (entity.metadata.wikipedia_url) {
        wikipedia = entity.metadata.wikipedia_url
      }
      return {"name": entity.name, "wikipedia": wikipedia}
    }
  })
  cleanEntities.filter(n => !!n)
  cleanEntities = _.uniqBy(cleanEntities, 'name');
  return cleanEntities
}
