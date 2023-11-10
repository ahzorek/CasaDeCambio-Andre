//initializes generic io
const converterForm = document.querySelector('.currency-converter')
const currencyInput = document.querySelector('#currencyInput')
const currencyOutput = document.querySelector('#currencyOutput')
const currencySelectFields = [currencyInput, currencyOutput]
const mainCurrencies = ['USD', 'EUR', 'GBP', 'JPY']
const quotesSlot = document.querySelector('.quotes')

const HTML = document.querySelector('html')

//starts the logic, gets all currency information
document.addEventListener('DOMContentLoaded', () => {
  //AJAX - Fazer uma requisição HTTPs / Consumo de API
  const xhr = new XMLHttpRequest()

  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/Moedas?$top=100&$skip=0&$format=json&$select=simbolo,nomeFormatado`

  xhr.open("GET", url)

  xhr.addEventListener("load", () => {
    const resposta = xhr.responseText
    const data = JSON.parse(resposta)

    const currencies = [
      { simbolo: "BRL", nomeFormatado: "Real Brasileiro" },
      ...data.value
    ]

    createCurrOptions(currencies)
    fillConversionRates(currencies)

  })
  xhr.send()

})

//a function to get a individual currency data (cotação valores)
async function getConvertionRate(
  curr,
  startDate = formatDate(new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))),
  endDate = formatDate(new Date(Date.now()))
) {
  const URL = `
    https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${curr}'&@dataInicial='${startDate}'&@dataFinalCotacao='${endDate}'&$top=100&$skip=0&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim
  `
  const res = await fetch(URL)
  const { value } = await res.json()
  return value
}

//a data structure (js map) that stores each individual currency data (nome, simbolo e conversion rates)
const currenciesTable = new Map()

//a repetition structure that gets each conversion rate and stores it in the data structure
async function fillConversionRates(currencies) {
  const conversionPromises = currencies.map(async (curr) => {
    if (curr.simbolo !== 'BRL') {
      const cotacoes = await getConvertionRate(curr.simbolo)
      currenciesTable.set(curr.simbolo, { ...curr, cotacoes })
    }
  })

  await Promise.all(conversionPromises)

  mainCurrencies.map((curr) => createQuoteBlocks(curr, currenciesTable))

  currenciesTable.set(
    'BRL',
    { simbolo: 'BRL', nomeFormatado: 'Real Brasileiro', cotacoes: [] }
  )

}

//a function that save the current state of the object data structure to the localstorage and sets expiration parameters

// a function that checks if there are data saved on localstorage and if data is valid (non stale)

// a function that retrieves the valid localstorage data and parse it to current app state

//an async function that keeps running on background to mantain the data updated


//converter logic

//function from brl to x
function convertFromBRL(outputCurrency, value, op) {
  const arr = currenciesTable.get(outputCurrency).cotacoes
  const rate = arr[arr.length - 1]
  console.log('VERIFICANDO', rate)
  if (op === 'compra') {
    return value / rate.cotacaoCompra
  }
  return value / rate.cotacaoVenda
}

//function from x to brl
function convertToBRL(inputCurrency, value, op) {
  const arr = currenciesTable.get(inputCurrency).cotacoes
  const rate = arr[arr.length - 1]
  console.log('VERIFICANDO', rate)
  if (op === 'compra') {
    return value * rate.cotacaoCompra
  }
  return value * rate.cotacaoVenda
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
    return convertToBRL(inputCurrency, value, 'compra')
  }
  else if (inputCurrency === 'BRL') {
    return convertFromBRL(outputCurrency, value)
  }
  else {
    return convertFromBRL(
      outputCurrency,
      convertToBRL(inputCurrency, value)
    )
  }

}

//fills the values on the currency select fields
function createCurrOptions(currencies) {
  currencySelectFields.forEach(field => {
    currencies.forEach(curr => {
      const symbol = getCurrencyFormat(curr.simbolo)
      const option = document.createElement('option')
      option.title = curr.nomeFormatado
      option.value = curr.simbolo
      option.innerHTML = symbol
      field.appendChild(option)
    })
  })
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
  const formatted = new Intl.NumberFormat(HTML.lang, {
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
  const output = converterForm.output

  output.value = getCurrencyFormat(
    outputCurrencySelected,
    convertCurrency(
      inputCurrencySelected,
      outputCurrencySelected,
      input
    ),
    false //passing false here so we dont get the symbol right next to the value, cause the select field should already be displaying it
  )
})



//side bar with main currency rates
function createQuoteBlocks(curr, table) {
  // console.log('create quote gets::::',
  //   curr,
  //   table
  // )
  const currInfo = table.get(curr)
  const currName = currInfo.nomeFormatado
  const currSymb = getCurrencyFormat(currInfo.simbolo)
  const quoteArr = currInfo.cotacoes
  const latestQuote = quoteArr[quoteArr.length - 1]
  const latestSellQuote = getCurrencyFormat(
    currInfo.simbolo,
    latestQuote.cotacaoVenda,
    false
  )

  const block = document.createElement('div')
  block.setAttribute('class', 'quote rounded-2')

  block.innerHTML = `
      <div class="quote rounded-2">
      <div class="top">
        <span>${currName}</span>
      </div>
      <div class="mid">
        <span>${latestSellQuote}</span>
      </div>
      <div class="bottom">
        <span class="symbol">${currSymb}</span>
        <span class="trending-icon">icon</span>
      </div>
    </div>
  `
  quotesSlot.appendChild(block)
}