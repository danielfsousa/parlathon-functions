const axios = require('axios')
const { get, sortBy, take } = require('lodash')

/**
* Lista as movimentações / tramitações da Câmara, Senado e Congresso
* @param {string} proposicaoId Proposição da câmara
* @returns {array} Movimentacoes
*/
module.exports = async (proposicaoId, context) => {
  const CASA_CAMARA_ID = 1
  const CASA_SENADO_ID = 2
  const CASA_CONGRESSO_ID = 3

  const camara = {
    obterProposicao: async (id) => {
      const res = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}`)
      const { data = {} } = res
      return data.dados || {}
    },
    obterTramitacoes: async (id) => {
      const res = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}/tramitacoes`)
      const { data = {} } = res
      return data.dados || []
    },
    obterOrgao: async (uriOrgao) => {
      const res = await axios.get(uriOrgao)
      const { data = {} } = res
      return data.dados || {}
    }
  }

  const senado = {
    obterMovimentacoes: async (urlSenado) => {
      if (!urlSenado) return []
      const { data = {} } = await axios.get(urlSenado)
      const servicos = get(data, 'DetalheMateria.Materia.OutrasInformacoes.Servico', [])
      const url = servicos.find(s => s.NomeServico === 'MovimentacaoMateria') || {}
      const { data: data2 = {} } = await axios.get(url.UrlServico)
      return get(data2, 'MovimentacaoMateria.Materia.Tramitacoes.Tramitacao', [])
    }
  }

  /*
  * ==========================================
  *   entrypoint
  * ==========================================
  */

  const [proposicao, movimentacoesDaCamara] = await Promise.all([
    camara.obterProposicao(proposicaoId),
    camara.obterTramitacoes(proposicaoId)
  ])

  // TODO: verificar se existem casos onde há mais de uma proposição relacionada
  const urlSenado = proposicao.uriPropAnterior || proposicao.uriPropPosterior
  const movimentacoesDoSenado = await senado.obterMovimentacoes(urlSenado)

  const normalizarDadosDaCamara = async (movimentacoes) => {
    const ordenados = sortBy(movimentacoes, 'sequencia')
    // const orgaos = await camara.obterOrgaos()

    const orgaosUri = ordenados.map(m => m.uriOrgao)
    const orgaos = await Promise.all(orgaosUri.map(camara.obterOrgao))

    return ordenados.map(movimentacao => {
      const orgao = orgaos.find(o => o.uri === movimentacao.uriOrgao)
      return {
        casaId: CASA_CAMARA_ID,
        casa: 'Câmara dos Deputados',
        data: new Date(movimentacao.dataHora),
        orgao: {
          sigla: orgao.sigla,
          nome: orgao.nome
        },
        descricaoDaTramitacao: movimentacao.descricaoTramitacao,
        descricaoDaSituacao: movimentacao.descricaoSituacao,
        despacho: movimentacao.despacho,
        documento: movimentacao.url
      }
    })
  }

  const normalizarDadosDoSenado = async (movimentacoes) => {
    return movimentacoes.map(movimentacao => {
      const tramitacao = movimentacao.IdentificacaoTramitacao
      const situacao = tramitacao.Situacao || {}
      const orgao = tramitacao.DestinoTramitacao.Local
      const casa = orgao.NomeCasaLocal
      const despacho = tramitacao.TextoTramitacao
      const textos = (movimentacao.Textos && movimentacao.Textos.Texto) || {}
      const documento = Array.isArray(textos)
        ? textos[0] && textos[0].UrlTexto
        : textos.UrlTexto

      return {
        casaId: casa === 'Senado Federal' ? CASA_SENADO_ID : CASA_CONGRESSO_ID,
        casa,
        data: new Date(tramitacao.DataTramitacao),
        orgao: {
          sigla: orgao.SiglaLocal,
          nome: orgao.NomeLocal
        },
        descricaoDaTramitacao: take(despacho.split(' '), 5).join(' '),
        descricaoDaSituacao: situacao.DescricaoSituacao,
        despacho,
        documento
      }
    })
  }

  const movimentacoes = [
    ...(await normalizarDadosDaCamara(movimentacoesDaCamara)),
    ...(await normalizarDadosDoSenado(movimentacoesDoSenado))
  ]

  return movimentacoes.sort((a, b) => a.data - b.data)
}
