const axios = require('axios')
const querystring = require('querystring')
const { get, random } = require('lodash')

/**
* Listar projetos de lei da CÂmara dos Deputados
* @returns {array}
*/
module.exports = async (context) => {
  const CASA = {
    id: 1,
    nome: 'Câmara dos Deputados'
  }

  const urlProposicoes = query => `https://dadosabertos.camara.leg.br/api/v2/proposicoes?${query}`
  const urlAutores = id => `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}/autores`

  const httpGet = async (url) => {
    const res = await axios.get(url)
    const { data = {} } = res
    const { dados = [] } = data
    return dados
  }

  // Proposições

  const parametros = { ...context.params }
  parametros.siglaTipo = get(context, 'params.siglaTipo', 'PL')
  parametros.ordem = get(context, 'params.ordem', 'DESC')
  parametros.ordenarPor = get(context, 'params.ordenarPor', 'numero')
  const query = querystring.stringify(parametros)

  const proposicoes = await httpGet(urlProposicoes(query))

  // Autores

  const autores = await Promise.all(proposicoes.map(p => httpGet(urlAutores(p.id))))
  const autoresAleatorios = autores.map(a => a[random(0, a.length - 1)] || {})

  const autoresDetalhes = await Promise.all(autoresAleatorios.map(autor => {
    return autor.uri ? httpGet(autor.uri) : {}
  }))

  const autoresComFotos = autoresAleatorios.map((autor, index) => {
    const id = autor.uri && autor.uri.match(/deputados\/(.*)/)[1]
    const detalhes = autoresDetalhes[index].ultimoStatus || {}
    return {
      id,
      nome: autor.nome,
      tipo: autor.tipo,
      partido: detalhes.siglaPartido,
      foto: detalhes.urlFoto
    }
  })

  // Join

  return proposicoes.map((proposicao, index) => ({
    id: proposicao.id,
    siglaTipo: proposicao.siglaTipo,
    numero: proposicao.numero,
    ano: proposicao.ano,
    ementa: proposicao.ementa,
    autor: autoresComFotos[index],
    casa: CASA
  }))
}
