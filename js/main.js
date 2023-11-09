//initializes generic io
const currencyConverterForm = document.querySelector('.currency-converter')
const currencyInput = document.querySelector('#currencyInput')
const currencyOutput = document.querySelector('#currencyOutput')
const currencySelectFields = [currencyInput, currencyOutput]
const HTML = document.querySelector('html')

//gets all currency information
function getCurrencies() {
  //AJAX - Fazer uma requisição HTTPs / Consumo de API
  const xhr = new XMLHttpRequest()

  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/Moedas?$top=100&$skip=0&$format=json&$select=simbolo,nomeFormatado`

  xhr.open("GET", url)

  xhr.addEventListener("load", () => {
    const resposta = xhr.responseText
    const data = JSON.parse(resposta)

    fillConversionRates(data.value)
    createCurrOptions(data.value)
  })
  xhr.send()
}
///executes
getCurrencies()


//a function to get a individual currency data (cotação valores)
async function getConvertionRate(
  curr,
  startDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
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
function fillConversionRates(currencies) {
  currencies.forEach(async curr => {
    const cotacoes = await getConvertionRate(curr.simbolo)
    currenciesTable.set(curr.simbolo, { ...curr, cotacoes })
  })
  currenciesTable.set(
    'BRL', { simbolo: "BRL", nomeFormatado: "Real Brasileiro", cotacoes: [] }
  )
}

//a function that save the current state of the object data structure to the localstorage and sets expiration parameters

// a function that checks if there are data saved on localstorage and if data is valid (non stale)

// a function that retrieves the valid localstorage data and parse it to current app state

//an async function that keeps running on background to mantain the data updated


//converter logic

//function from brl to x
function convertFromBRL(outputCurrency, value, op) {
  const rate = currenciesTable.get(outputCurrency).cotacoes.pop()
  if (op === 'compra') {
    return value / rate.cotacaoCompra
  }
  return value / rate.cotacaoVenda
}

//function from x to brl
function convertToBRL(inputCurrency, value, op) {
  const rate = currenciesTable.get(inputCurrency).cotacoes.pop()
  console.log(rate);
  if (op === 'compra') {
    return value * rate.cotacaoCompra
  }
  return value * rate.cotacaoVenda
}
//function from x to y (thru BRL)
function convertCurrency(inputCurrency, outputCurrency, value = 1) {
  if (inputCurrency === outputCurrency) {
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
      const symbol = formatToCurrencyDisplay(curr.simbolo)
      const option = document.createElement('option')
      option.title = curr.nomeFormatado
      option.value = curr.simbolo
      option.innerHTML = symbol
      field.appendChild(option)
    })
  })
}

//monitors value changes on the currency select inputs
currencySelectFields.forEach(field => {
  field.addEventListener('change', e => {
    currencyConverterForm.submitBtn.click()
  })
})

//formats date to MM-DD-YYYY
function formatDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${month}-${day}-${year}`
}

//formats to currency
function formatToCurrencyDisplay(curr, value = NaN, symbol = true) {
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

function formatToCurrencyNOSymbol(value) {
  const formatted = new Intl.NumberFormat(HTML.lang, {
    style: 'decimal'
  }).format(value)

  return formatted
}

//handles form

currencyConverterForm.addEventListener('submit', e => {
  e.preventDefault()
  const input = currencyConverterForm.input.value
  const inputCurrencySelected = currencyConverterForm.nm_currencyInput.value
  const outputCurrencySelected = currencyConverterForm.nm_currencyOutput.value
  const output = currencyConverterForm.output

  output.value = formatToCurrencyDisplay(
    outputCurrencySelected,
    convertCurrency(
      inputCurrencySelected,
      outputCurrencySelected,
      input
    ),
    false
  )
})



