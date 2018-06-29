const querystring = require('querystring')
const axios = require('axios')

module.exports = async (context) => {

    const {params} = context

    const httpGetCamara = async (params) => {

    }

    const httpGetSenado = async (params) => {

    }

    const getHousesParams = (type, params) => {
        /**
         * 1 = Camara
         * 2 = Senado
         */
        let p = {}
        if (type === 1) {
            if (params.numero) p.numero = params.numero
            if (params.ano) p.ano = params.ano
            if (params.tipo) p.siglaTipo = params.tipo
            if (params.keywords) p.keywords = params.keywords
        } else if (type === 2) {
            if (params.numero) p.numero = params.numero
            if (params.ano) p.ano = params.ano
            if (params.tipo) p.siglaTipo = params.tipo
            if (params.keywords) p.keywords = params.palavraChave
        }
    }
}