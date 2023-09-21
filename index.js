let deckId = 0
const currentTokens = document.querySelector('#tokens span')
console.log(currentTokens)
let currentBet = 1
const betForm = document.querySelector('#bet-form')

const cardsDivs = document.querySelectorAll('.card')
const draw = document.querySelector('#draw')
const redraw =document.querySelector('#redraw')

function unshade(e){
    e.target.style.opacity= '100%'
}
function shade(e){
    e.target.style.opacity= '50%'
}

function selectByClick(e){
    if(e.target.style.opacity== 0.5){
        e.target.style.opacity= '40%'
        e.target.removeEventListener('mouseover', shade)
        e.target.removeEventListener('mouseleave', unshade)
    }else{
        e.target.style.opacity = '50%'
        e.target.addEventListener('mouseover', shade)
        e.target.addEventListener('mouseleave', unshade)
    }
}

for (card of cardsDivs){
    const cardImage = document.createElement('img')
    cardImage.src = 'https://deckofcardsapi.com/static/img/back.png'
    cardImage.classList.add('card-image')
    card.append(cardImage)
}

betForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(r => r.json())
    .then(info => {
        deckId = info.deck_id
        fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`)
        .then(r => r.json())
        .then(data => {
            currentBet = e.target.bet.value
            console.log(e.target.bet.value)
            newTokens = currentTokens.textContent - currentBet
            currentTokens.textContent = newTokens
            redraw.disabled = false
            betForm.submit.disabled = true
            betForm.bet.disabled = true
            data.cards.forEach((card,index) => {
                const cardImageInHand = document.querySelector('#card'+index+ ' img')
                cardImageInHand.src = card.image
                cardImageInHand.id = card.image.split('/')[5].split('.')[0]
                cardImageInHand.style.opacity='100%'
                cardImageInHand.addEventListener('mouseover', shade)
                cardImageInHand.addEventListener('mouseleave', unshade)
                cardImageInHand.addEventListener('click', selectByClick)
            })
            }        
        )})
})

// create button that will find selected cards and will discard them,
// and thne draw the same number of cards and replace them

redraw.addEventListener('click', (e) =>{
    const cardImgs = document.querySelectorAll('.card-image')
    const imgToReplace = []
    const cardsToDiscard = []
    for (image of cardImgs){
        if(image.style.opacity == 0.4){
            imgToReplace.push(image)
            cardsToDiscard.push(image.id)
        }
    }
    const cardsAsString = ''
    for(card of cardsToDiscard)
        if(card === cardsAsString[0]){
            cardsAsString = card
        }else{
            cardsAsString+','+card
        }
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/pile/discard/add/?cards=${cardsAsString}`)
    .then(r=>r.json())
    .then(data => {
        fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${cardsToDiscard.length}`)
        .then(r=>r.json())
        .then(responseInfo =>{
            const newCards = responseInfo.cards
            newCards.forEach((card,index)=>{
                imgToReplace[index].src = card.image
                imgToReplace[index].id = card.image.split('/')[5].split('.')[0]
                imgToReplace[index].style.opacity = '100%'
            })
            redraw.disabled = true
            betForm.submit.disabled = false
            betForm.bet.disabled = false
            const finalCards = []
            for(image of cardImgs){
                image.removeEventListener('mouseover', shade)
                image.removeEventListener('mouseleave', unshade)
                image.removeEventListener('click', selectByClick)
                finalCards.push(image.src.split('/')[5].split('.')[0])
            }
            console.log(findPairs(finalCards))
            })
        })
    
})

function findPairs(cardsArray){
    cardsArray.forEach((card, index) =>{
        const cardsArray2 = cardsArray.filter((otherCard,otherIndex)=>{
            return index !== otherIndex
        })
    })
        
}