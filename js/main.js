//initializes generic io
const currSelect = document.querySelector('#moeda')


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
async function getConvertionRate(curr, date = formatDate(new Date())) {
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${curr}'&@dataCotacao='${date}'&$top=100&$skip=0&$format=json&$select=cotacaoVenda,dataHoraCotacao,tipoBoletim`
  const res = await fetch(url)
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

// a function that checks if there are data saved on localstorage and if data is valid (non expired)

// a function that retrieves the valid localstorage data and parse it to current app state

//a async function that keeps running on background to mantain the data updated


//converter logic

//function from brl to x

//function from x to brl

//function from x to y (thru brl)





function createCurrOptions(currencies) {
  currencies.map(curr => {
    const option = document.createElement('option')
    option.value = curr.simbolo
    option.innerHTML = curr.nomeFormatado

    currSelect.appendChild(option)
  })

}

currSelect.addEventListener('change', async e => {
  const resposta = currenciesTable.get(e.target.value)
  console.log(resposta)
})

function formatDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}-${day}-${year}`
}