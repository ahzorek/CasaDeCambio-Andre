//initializes generic io
const currSelect = document.querySelector('#moeda')
const HTML = document.querySelector('html')

//gets all currency information
function getCurrencies() {
  //AJAX - Fazer uma requisição HTTPs / Consumo de API
  var xhr = new XMLHttpRequest()

  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/Moedas?$top=100&$skip=0&$format=json&$select=simbolo,nomeFormatado`

  xhr.open("GET", url)

  xhr.addEventListener("load", () => {
    let resposta = xhr.responseText
    let data = JSON.parse(resposta)

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
    https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${curr}'&@dataInicial='${startDate}'&@dataFinalCotacao='${endDate}'&$top=100&$skip=0&$format=json&$select=cotacaoVenda,dataHoraCotacao,tipoBoletim
  `
  const res = await fetch(URL)
  const data = await res.json()
  return data.value
}

//a data structure (js map) that stores each individual currency data (nome, simbolo e conversion rates)
const currenciesTable = new Map()

//a repetition structure that gets each conversion rate and stores it in the data structure
function fillConversionRates(currencies) {
  currencies.forEach(async curr => {
    const cotacoes = await getConvertionRate(curr.simbolo)
    currenciesTable.set(curr.simbolo, { ...curr, cotacoes })
  })
}

//a function that save the current state of the object data structure to the localstorage and sets expiration parameters

// a function that checks if there are data saved on localstorage and if data is valid (non stale)

// a function that retrieves the valid localstorage data and parse it to current app state

//an async function that keeps running on background to mantain the data updated


//converter logic

//function from brl to x
function convertFromBRL(outputCurrency, value = 1) {
  const rate = currenciesTable.get(outputCurrency).cotacoes.pop().cotacaoVenda
  return value / rate
}

//function from x to brl
function convertToBRL(inputCurrency, value = 1) {
  const rate = currenciesTable.get(inputCurrency).cotacoes.pop().cotacaoVenda
  return value * rate
}
//function from x to y (thru BRL)
function convertCurrency(inputCurrency, outputCurrency, value = 1) {
  const valueBRL = (inputCurrency !== 'BRL')
    ? convertToBRL(inputCurrency, value)
    : inputCurrency
  const exitValue = convertFromBRL(outputCurrency, valueBRL)
  return exitValue
}


function createCurrOptions(currencies) {
  currencies.map(curr => {
    const option = document.createElement('option')
    const symbol = formatToCurrencyDisplay(curr.simbolo)
    option.value = curr.simbolo
    option.innerHTML = `${curr.nomeFormatado} - ${symbol}`

    currSelect.appendChild(option)
  })

}

currSelect.addEventListener('change', e => {
  const resposta = formatToCurrencyDisplay(
    e.target.value,
    convertCurrency('USD', e.target.value, 2)
  )

  // convertCurrency('GBP', 'USD', 1)
  console.log(resposta)
})

//formats date to MM-DD-YYYY
function formatDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}-${day}-${year}`
}

//formats to currency
function formatToCurrencyDisplay(curr, value = NaN) {
  const formatted = new Intl.NumberFormat(HTML.lang, {
    style: 'currency',
    currency: curr,
    currencyDisplay: 'symbol',
  }).format(value)

  if (!value) {
    return formatted.replace(/\NaN/g, '').trim()
  }

  return formatted
}