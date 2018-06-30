const querystring = require('querystring')
const axios = require('axios')
const { get } = require('lodash')

module.exports = async (context) => {

    const {params} = context

    const httpGetCamara = async (params) => {
        const res = await axios.get("https://dadosabertos.camara.leg.br/api/v2/proposicoes", {params});
        return get(res, 'data.dados', [])
    }

    const httpGetSenado = async (params) => {
        const res = await axios.get("http://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista", {params, headers: { 'Accept': "application/json" }});
        return get(res, 'data.PesquisaBasicaMateria.Materias.Materia', [])
    }

    const getHousesParams = (type, params) => {
        /**
         * 1 = Camara
         * 2 = Senado
         */
        let p = {}
        if (type == 1) {
            if (params.numero) p.numero = params.numero
            if (params.ano) p.ano = params.ano
            if (params.tipo) {
                let tipo = params.tipo == "PLC" ? "PL" : params.tipo
                p.siglaTipo = tipo
            }
            if (params.keywords) p.keywords = params.keywords
            p.ordenarPor = "ano"
            p.ordem = "DESC"
        } else if (type == 2) {
            if (params.numero) p.numero = params.numero
            if (params.ano) p.ano = params.ano
            if (params.tipo) p.sigla = params.tipo
            if (params.keywords) p.palavraChave = params.keywords
        }

        return p
    }

    // {
    //     id: proposicao.IdentificacaoMateria.CodigoMateria,
    //     siglaTipo: proposicao.IdentificacaoMateria.SiglaSubtipoMateria,
    //     dataApresentacao: new Date(proposicao.DadosBasicosMateria.DataApresentacao),
    //     situacao: proposicao.SituacaoAtual.Autuacoes.Autuacao.Situacao.DescricaoSituacao,
    //     numero: proposicao.IdentificacaoMateria.NumeroMateria,
    //     ano: proposicao.IdentificacaoMateria.AnoMateria,
    //     ementa: proposicao.DadosBasicosMateria.EmentaMateria,
    //     autor: getAutorAleatorio(proposicao),
    //     casa: CASA
    //   }
    // http://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?palavraChave=Econômico&tipoPalavraChave=T
    // https://dadosabertos.camara.leg.br/api/v2/proposicoes?ano=&ordenarPor=ano&ordem=ASC&siglaTipo=PLC&numero
    // return "Hello World!"

    const objetoCamara = httpGetCamara(getHousesParams(1, params))
    const objetoSenado = httpGetSenado(getHousesParams(2, params))

    // {
    //     id: proposicao.IdentificacaoMateria.CodigoMateria,
    //     siglaTipo: proposicao.IdentificacaoMateria.SiglaSubtipoMateria,
    //     dataApresentacao: new Date(proposicao.DadosBasicosMateria.DataApresentacao),
    //     situacao: proposicao.SituacaoAtual.Autuacoes.Autuacao.Situacao.DescricaoSituacao,
    //     numero: proposicao.IdentificacaoMateria.NumeroMateria,
    //     ano: proposicao.IdentificacaoMateria.AnoMateria,
    //     ementa: proposicao.DadosBasicosMateria.EmentaMateria,
    //     autor: getAutorAleatorio(proposicao),
    //     casa: CASA
    //   }

    return objetoSenado;
    // return 123;
}
