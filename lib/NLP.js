const language = require('@google-cloud/language').v1beta2
const client = new language.LanguageServiceClient()

module.exports = async function (text) {
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
