const tika = require('tika')
const splitSentence = require('sentence-splitter')

const sentenceCleaner = function (text) {
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

module.exports = async function (filePath) {
  return new Promise((resolve, reject) => {
    const options = { contentType: 'application/pdf' }
    tika.extract(filePath, options, function(err, text, meta) {
      if (err) reject(err)
      const cleanSplit = sentenceCleaner(text)
      const info = { text, meta, cleanSplit }
      resolve(info)
    });
  });
};
