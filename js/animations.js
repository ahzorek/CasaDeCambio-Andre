let maxScroll

document.addEventListener('DOMContentLoaded', () => {
  console.log('dom has loaded');

  const mainIcon = document.querySelector('.clip-bg')
  maxScroll = window.innerHeight

  document.addEventListener('scroll', e => {
    const headerBlock = document.querySelectorAll('.header-block')
    const scrolled = convertToPercentage(window.scrollY, maxScroll)
    const iconSize = Math.round(convertFromPercentage(scrolled))
    if (scrolled <= 100) {
      mainIcon.setAttribute('style', `transform: scale(${iconSize}%);`)
      headerBlock.forEach(block => {
        block.setAttribute('style', `transform: translateY(-${scrolled}%)`)
      })
    } else {

    }
    // console.log('% icon', scrolled);
  })

})

window.addEventListener('resize', e => {
  maxScroll = window.innerHeight
})


function convertToPercentage(value, x) {
  if (value < 0) {
    return 0;
  } else if (value > x) {
    return 100;
  } else {
    return (value / x) * 100;
  }
}


function convertFromPercentage(percentage) {
  if (percentage < 0) {
    return 100;
  } else if (percentage > 100) {
    return 350;
  } else {
    return (percentage / 100) * (350 - 100) + 100;
  }
}
