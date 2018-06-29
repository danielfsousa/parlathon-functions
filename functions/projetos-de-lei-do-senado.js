const axios = require('axios')
const querystring = require('querystring')
const { get, random, take, partial } = require('lodash')

/**
* Listar projetos de lei da Senado federal
* @returns {array} Lista de projetos de lei do senado
*/
module.exports = async (context) => {
  const CASA = {
    id: 2,
    nome: 'Senado Federal'
  }

  const urlProposicoes = query => `http://legis.senado.leg.br/dadosabertos/materia/atualizadas?${query}`
  const urlProposicoesDetalhes = id => `http://legis.senado.leg.br/dadosabertos/materia/${id}`

  const httpGetManyMaterias = async (url) => {
    const res = await axios.get(url)
    return get(res, 'data.ListaMateriasAtualizadas.Materias.Materia', [])
  }

  const httpGetOneMateria = async (url) => {
    const res = await axios.get(url)
    return get(res, 'data.DetalheMateria.Materia', {})
  }

  const getAutorAleatorio = (proposicao) => {
    const autores = get(proposicao, 'Autoria.Autor', [])
    const autorAleatorio = autores[random(0, autores.length - 1)] || {}
    const getProp = partial(get, autorAleatorio)
    return {
      id: getProp('IdentificacaoParlamentar.CodigoParlamentar'),
      nome: getProp('NomeAutor'),
      foto: getProp('IdentificacaoParlamentar.UrlFotoParlamentar')
    }
  }

  const parametros = { ...context.params }
  parametros.sigla = get(context, 'params.siglaTipo', 'PLS')
  const query = querystring.stringify(parametros)
  const itens = get(context, 'params.itens', 15)

  const proposicoes = take(await httpGetManyMaterias(urlProposicoes(query)), itens)
  const proposicoesDetalhadas = await Promise.all(
    proposicoes
      .map(p => p.IdentificacaoMateria.CodigoMateria)
      .map(urlProposicoesDetalhes)
      .map(httpGetOneMateria)
  )

  return proposicoesDetalhadas.map((proposicao) => ({
    id: proposicao.IdentificacaoMateria.CodigoMateria,
    siglaTipo: proposicao.IdentificacaoMateria.SiglaSubtipoMateria,
    dataApresentacao: new Date(proposicao.DadosBasicosMateria.DataApresentacao),
    situacao: proposicao.SituacaoAtual.Autuacoes.Autuacao.Situacao.DescricaoSituacao,
    numero: proposicao.IdentificacaoMateria.NumeroMateria,
    ano: proposicao.IdentificacaoMateria.AnoMateria,
    ementa: proposicao.DadosBasicosMateria.EmentaMateria,
    autor: getAutorAleatorio(proposicao),
    casa: CASA
  }))
}
