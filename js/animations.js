document.addEventListener('DOMContentLoaded', () => {
  console.log('dom has loaded');

  const bodyRect = document.body.getBoundingClientRect()
  const firstFold = document.querySelector('.back-layer').getBoundingClientRect()
  const mainIcon = document.querySelector('.clip-bg')
  console.log('BODY:::', bodyRect);
  console.log('FIRST FOLD:::', firstFold);

  console.log('space to scroll ===', bodyRect.height - firstFold.height);

  const maxScroll = bodyRect.height - firstFold.height

  document.addEventListener('scroll', e => {
    const scrolled = convertToPercentage(window.scrollY, maxScroll)
    const iconSize = Math.round(convertFromPercentage(scrolled))
    mainIcon.setAttribute('style', `transform: scale(${iconSize}%);`)
    // console.log('% icon', scrolled);
  })

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
