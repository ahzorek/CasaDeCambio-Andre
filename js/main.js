/*
  Nome do Script: CurrencyConverter (for pyramidx)
  Descrição: Esse app realiza conversões de moedas usando como fonte a API de cotações do Banco Central do Brasil

  Versão: 0.4
  Autor: Andre

  Histórico de Versões:
  - v0.1 (10/11/2023)
    - Implementa as funcionalidades básicas do APP e sua primeira versão de interface visual.
  - v0.2 (11/11/2023)
    - Implementa responsividade na interface.
  - v0.3 (13/11/2023)
    - Implementa adição de alguns efeitos visuais e melhora acessibilidade de alguns elementos.
  - v0.4 (19/11/2023)
    - Alterações no fluxo de execuçõ inicial do app. 
        Substitui uso de XHR por fetch. 
        Implementa um fluxo logico sequencial para toda inicialização.
        Reestrutura para que cada fn() executa apenas uma 'função geral', um objetivo.
        Implementa um tratamento de erros bem básico na execução inicial do app.
        Elimina redundancias nas chamadas de determinadas fn() e criação de valores.
  - v0.4.1
    - quick fix na chamada de valores de compra e venda (thx ana)
*/

//initializes generic io
const converterForm = document.querySelector('.currency-converter')
const currencyInput = document.querySelector('#currencyInput')
const currencyOutput = document.querySelector('#currencyOutput')
const currencySelectFields = [currencyInput, currencyOutput]
const mainCurrencies = ['USD', 'EUR', 'GBP', 'DKK']
const quotesSlot = document.querySelector('.quotes')
const infoSlot = document.querySelector('.info')

//a data structure (JS Map) that stores each individual currency data (nome, abbrev, simbolo e conversion rates)
const currenciesTable = new Map()
currenciesTable.set(
  'BRL',
  { simbolo: 'BRL', symbol: 'R$', nomeFormatado: 'Real Brasileiro', cotacoes: null }
)

// app starting logic
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // list with all currencies available on the api
    const currencies = await fetchInitialValues()

    // fetches all most recent data for each currency (defaults for the last 7 days) and stores it
    await createCurrenciesTable(currencies)

    // using the currencyTable JS Map object, fills the select input fields with currency data
    createCurrOptionsFromMap(currenciesTable)

    // creates a ref to the latest 'cotacoes' object fetched
    const latestDataSourced = Array.from(currenciesTable.entries())[1][1].cotacoes

    // passes the most recent data from 'cotacoes' so this info is shown on the footer
    fillsLastRetrievedData(latestDataSourced[latestDataSourced.length - 1])

    // using the currencyTable JS Map object, fills the aside block with 4 commonly used currencies and its info
    mainCurrencies.map((curr) => createQuoteBlocks(curr, currenciesTable))

    console.log('app inicializado')
  } catch (error) {
    console.error('ocorreu um erro na inicialização do app. tente novamente mais tarde:', error)
    //fazer alguma coisa no front p esse erro
  }
})


async function fetchInitialValues() {
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/Moedas?$top=100&$skip=0&$format=json&$select=simbolo,nomeFormatado`
  const res = await fetch(url)
  const { value } = await res.json()

  return value
}

//a repetition structure that gets each conversion rate and stores it in the data structure
async function createCurrenciesTable(currencies) {
  const conversionPromises = currencies.map(async curr => {

    const cotacoes = await getConvertionRate(curr.simbolo)
    const symbol = getCurrencyFormat(curr.simbolo)
    currenciesTable.set(curr.simbolo, { ...curr, symbol, cotacoes })
  })

  await Promise.all(conversionPromises)
}

//a function to get an individual currency data (cotação valores)
async function getConvertionRate(
  curr,
  startDate = formatDate(new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))), //defaults to 7 days ago
  endDate = formatDate(new Date(Date.now())) // defaults to now
) {
  const URL = `
    https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${curr}'&@dataInicial='${startDate}'&@dataFinalCotacao='${endDate}'&$top=100&$skip=0&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim
  `
  const res = await fetch(URL)
  const { value } = await res.json()

  return value
}

//fills the values on the currency select fields
function createCurrOptionsFromMap(table) {

  currencySelectFields.forEach(field => {

    Array.from(table.entries()).forEach(([_, curr]) => {
      const option = document.createElement('option')
      option.title = curr.nomeFormatado
      option.value = curr.simbolo
      option.innerHTML = curr.symbol

      field.appendChild(option)
    })
  })
}

// a function that save the current state of the object data structure to the localstorage and sets expiration parameters

// a function that checks if there are data saved on localstorage and if data is valid (non stale)

// a function that retrieves the valid localstorage data and parse it to current app state

// an async function that keeps running on background to mantain the data updated


//converter logic

//function from brl to x
function convertFromBRL(outputCurrency, value) {
  const arr = currenciesTable.get(outputCurrency).cotacoes
  const rate = arr[arr.length - 1]
  // console.log('VERIFICANDO', rate)
  return value / rate.cotacaoVenda
}

//function from x to brl
function convertToBRL(inputCurrency, value) {
  const arr = currenciesTable.get(inputCurrency).cotacoes
  const rate = arr[arr.length - 1]
  // console.log('VERIFICANDO', rate)
  return value * rate.cotacaoCompra

}

//function from x to y (thru BRL)
function convertCurrency(inputCurrency, outputCurrency, value = 1) {
  if (!inputCurrency | !outputCurrency) {
    console.error('Issues with convertCurrency params')
  }
  else if (inputCurrency === outputCurrency) {
    return value
  }
  else if (outputCurrency === 'BRL') {
    return convertToBRL(inputCurrency, value)
  }
  else if (inputCurrency === 'BRL') {
    return convertFromBRL(outputCurrency, value)
  }
  else {
    //converte para moeda de saida usando como input o retorno do valor de entrada convertido para real
    return convertFromBRL(
      outputCurrency,
      convertToBRL(inputCurrency, value) //converte o valor da moeda de entrada para real
    )
  }

}

//monitors value changes on the currency select inputs, fires side effects if needed
currencySelectFields.forEach(field => {
  field.addEventListener('change', () => {
    converterForm.submit.click()
  })
})

//monitors value changes on the value input, fires side effects if needed
converterForm.input.addEventListener('keyup', e => {
  converterForm.submit.click()
})

//formats date to MM-DD-YYYY
function formatDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${month}-${day}-${year}`
}

//formats to currency
function getCurrencyFormat(curr, value = NaN, symbol = true) {
  const formatted = new Intl.NumberFormat(Document.lang, {
    style: 'currency',
    currency: curr,
    currencyDisplay: symbol ? 'symbol' : 'code',
  }).format(value)

  if (!value) {
    return formatted.replace(/\NaN/g, '').trim()
  }
  else if (!symbol) {
    return formatted.replace(curr, '').trim()
  }
  else
    return formatted
}

//handles converter form logic
converterForm.addEventListener('submit', e => {
  e.preventDefault()
  const input = converterForm.input.value
  const inputCurrencySelected = converterForm.nm_currencyInput.value
  const outputCurrencySelected = converterForm.nm_currencyOutput.value
  const output = document.querySelector('#output')

  output.innerText = getCurrencyFormat(
    outputCurrencySelected,
    convertCurrency(
      inputCurrencySelected,
      outputCurrencySelected,
      input
    ),
    false //passing false here so we dont get the symbol right next to the value, cause the select field should already be displaying it
  )
})

//fires side effects when clicking one of the quotes blocks
const triggerQuoteByEvent = currSymb => {
  currencyOutput.value = currSymb
  converterForm.submit.click()
}

//side bar with main currency rates
function createQuoteBlocks(curr, table) {
  const currInfo = table.get(curr)
  const quoteArr = currInfo.cotacoes
  const latestQuote = quoteArr[quoteArr.length - 1]
  const comparingQuote = quoteArr[quoteArr.length - 10]
  const variation = latestQuote.cotacaoVenda - comparingQuote.cotacaoVenda
  const icon = (variation > 0) ? trendingUp : trendingDown

  const latestSellQuote = getCurrencyFormat(
    currInfo.simbolo,
    latestQuote.cotacaoVenda,
    false
  )

  const block = document.createElement('div')
  block.setAttribute('class', 'quote rounded-2')
  block.setAttribute('id', currInfo.simbolo)
  block.setAttribute('title', `Usar ${currInfo.simbolo} como moeda de saída`)
  block.addEventListener('click', () => triggerQuoteByEvent(block.id))

  if (variation > 0) {
    block.classList.add('trending-up')
  } else {
    block.classList.add('trending-down')
  }

  block.innerHTML = `
    <div class="top">
      <span>${currInfo.nomeFormatado}</span>
    </div>
    <div class="mid">
      <span>${latestSellQuote}</span>
    </div>
    <div class="bottom">
      <span class="symbol">${currInfo.symbol}</span>
      <span class="trending-icon">
        ${icon}
      </span>
    </div>
  `
  quotesSlot.appendChild(block)
}

function fillsLastRetrievedData(data) {
  const { tipoBoletim, dataHoraCotacao } = data
  const date = new Date(dataHoraCotacao).toLocaleString()
  const text = `
    Os dados dessa página foram gerados em ${date} no boletim tipo ${tipoBoletim}.
  `
  infoSlot.innerHTML = text
}

//icons
const trendingUp = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-graph-up-arrow" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/>
    </svg>
  `
const trendingDown = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-graph-down-arrow" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 11.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-1 0v2.6l-3.613-4.417a.5.5 0 0 0-.74-.037L7.06 8.233 3.404 3.206a.5.5 0 0 0-.808.588l4 5.5a.5.5 0 0 0 .758.06l2.609-2.61L13.445 11H10.5a.5.5 0 0 0-.5.5Z"/>
    </svg>
  `

