let deckId = 0
const currentTokens = document.querySelector('#tokens span')
let currentBet = 1
const betForm = document.querySelector('#bet-form')

const cardsDivs = document.querySelectorAll('.card')
const draw = document.querySelector('#draw')
const redraw = document.querySelector('#redraw')

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
        const discardIndicator = document.createElement('p')
        discardIndicator.className = "discard"
        discardIndicator.textContent = 'DISCARD'
        e.target.parentNode.append(discardIndicator)
    }else{
        e.target.style.opacity = '50%'
        e.target.addEventListener('mouseover', shade)
        e.target.addEventListener('mouseleave', unshade)
        e.target.parentNode.querySelector('.discard').remove()
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
    try{
        document.querySelector('#result').remove()
    }
    catch(err){}
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(r => r.json())
    .then(info => {
        deckId = info.deck_id
        fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=5`)
        .then(r => r.json())
        .then(data => {
            currentBet = e.target.bet.value
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
            image.parentNode.querySelector('.discard').remove()
        }
    }
    const cardsAsString = ''
    for(card of cardsToDiscard){
        if(card === cardsAsString[0]){
            cardsAsString = card
        }else{
            cardsAsString+','+card
        }
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
                finalCards.push(image.id)
            }
            finalCards.forEach((card,index)=>{
                if(card === 'aceDiamonds'){
                    finalCards[index] = 'AD'
                }
            })
            let result = ''
            const findPairResults = findPairs(finalCards)
            if(findPairResults[0]){
                if(findThree(findPairs(finalCards)[2],findPairs(finalCards)[1])){
                    result = 'Three of a Kind!'
                }else if (findPairs(findPairResults[2])[0]){
                    result = 'Two Pair!'
                }else{
                    result = 'Pair!'
                }
            }else{
                result = 'Better Luck Next Time!'
            }
            const resultElement = document.createElement('p')
            resultElement.id = 'result'
            resultElement.textContent = result
            document.querySelector('body').append(resultElement)
            })
        })
    
})

function findPairs(cardsArray){
    let hasPairs = false
    let pairCard = ''
    let remainingCards = ''
    cardsArray.forEach((card, index) =>{
        const cardsArray2 = cardsArray.filter((otherCard,otherIndex)=>{
            return index !== otherIndex
        })
        cardsArray2.forEach((secondCard, secondIndex)=>{
            if((card[0] === secondCard[0])){
                hasPairs = true
                pairCard = card[0]
                remainingCards = cardsArray2.filter((thirdCard,thirdIndex)=>{
                    return secondIndex !== thirdIndex
                })
            }
        })
    })
    return [hasPairs, pairCard, remainingCards]
}

function findThree(remainingCards,pairCard){
    let hasThree = false
    remainingCards.forEach((card,index)=>{
        if((card[0]=== pairCard)){
            hasThree = true
        }
    })
    return hasThree
}