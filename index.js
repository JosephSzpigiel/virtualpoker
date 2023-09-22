let deckId = 0
const currentTokens = document.querySelector('#tokens span')
let currentBet = 1
const betForm = document.querySelector('#bet-form')
const error = document.querySelector('#error')
const cardsDivs = document.querySelectorAll('.card')
const draw = document.querySelector('#draw')
const redraw = document.querySelector('#redraw')

for (card of cardsDivs){
    const cardImage = document.createElement('img')
    cardImage.src = 'https://deckofcardsapi.com/static/img/back.png'
    cardImage.classList.add('card-image')
    card.append(cardImage)
}   

betForm.addEventListener('submit', gameStart)

function gameStart(e){
    e.preventDefault()
    try{
        document.querySelector('#result').remove()
        document.querySelector('#winnings').remove()
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
            if (newTokens < 0){
                error.textContent = 'Not Enough Tokens!'
            }else{
                error.textContent = ''
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
            })}
            }        
        )})
}

// create button that will find selected cards and will discard them,
// and thne draw the same number of cards and replace them

redraw.addEventListener('click', endGame)

function endGame(e){
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
            let finalCards = []
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

            // forTesting
            //finalCards = ['AD','AH','5C','5H','5D']

            let result = ''
            let baseWinnings = ''
            const findPairResults = findPairs(finalCards)
            if(findPairResults[0]){
                const cardsRemaining = findPairs(finalCards)[2]
                const matchCard = findPairs(finalCards)[1][0]

                if(findThree(cardsRemaining,matchCard)[0]){
                    if(findThree(findThree(cardsRemaining,matchCard)[2],matchCard)[0]){
                        result = 'Four of a Kind!'
                        baseWinnings = 25
                    }else if(findPairs(findThree(cardsRemaining,matchCard)[2])[0]){
                        result = 'Full House!'
                        baseWinnings = 9
                    }else{
                        result = 'Three of a Kind!'
                        baseWinnings = 3
                    }
                }else if (findPairs(findPairResults[2])[0]){
                    if (findThree(findPairs(findPairResults[2])[2],findPairs(findPairResults[2])[1])[0]){
                        result = 'Full House!'
                        baseWinnings = 9
                    }else{
                        result = 'Two Pair!'
                        baseWinnings = 2
                    }
                }else{
                    if(Number.isInteger(parseInt(matchCard))){
                        result = 'Better Luck Next Time!'
                        baseWinnings = 0
                    }else{
                        result = 'Jacks or Better!'
                        baseWinnings = 1
                    }
                }
            }else{
                if(findStraight(finalCards)[0]){
                    if(findFlush(finalCards)){
                        if(findStraight(finalCards)[1]){
                            result = 'ROYAL FLUSH!!'
                            baseWinnings = 250
                        }else{
                            result = 'Straight Flush!'
                            baseWinnings = 50
                        }
                    }else{
                        result = 'Straight!'
                        baseWinnings = 4
                    }
                }else if(findFlush(finalCards)){
                    result = 'Flush!'
                    baseWinnings = 6
                }else{
                    result = 'Better Luck Next Time!'
                    baseWinnings = 0
                }
            }
            //Apply Winnings

            let won = baseWinnings*currentBet
            if(result === "ROYAL FLUSH!!" && currentBet === 5){
                won === 4000
            }
            newTokens = parseInt(currentTokens.textContent) + won
            currentTokens.textContent = newTokens
            const resultElement = document.createElement('p')
            resultElement.id = 'result'
            resultElement.textContent = result
            document.querySelector('#results-div').append(resultElement)
            const winnings = document.createElement('p')
            winnings.id = 'winnings'
            winnings.textContent = `Win: ${won}`
            document.querySelector('#results-div').append(winnings)
            if(currentTokens.textContent == 0){
                error.textContent = 'Out of Tokens!'
                betForm.submit.disabled = true
            }
            })
        })
    
}

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
    let finalRemainingCards = []
    remainingCards.forEach((card,index)=>{
        if((card[0]=== pairCard)){
            hasThree = true
            finalRemainingCards = remainingCards.filter((remainingCard,remainingIndex)=>{
                return index !== remainingIndex
            })
        }
    })
    return [hasThree, pairCard, finalRemainingCards]
}

function findFlush(cardsArray){
    let isFlush = true
    const toCheck = cardsArray[0][1]
    for(card of cardsArray){
        if(card[1] !== toCheck){
            isFlush = false
            break
        }
    }
    return isFlush
}

function findStraight(cardsArray){
    let isStraight = false
    let isRoyal = false
    const valuesArray = cardsArray.map(card => card[0])
    const intValues = []
    let intValuesConsecutive = true
    const strValues = []
    for(value of valuesArray){
        if(Number.isInteger(parseInt(value))){
            if(parseInt(value) === 0){
                intValues.push(10)
            }else{
                intValues.push(parseInt(value))
            }
        }else{
            strValues.push(value)
        }
    }
    intValues.sort((a, b) => a - b)
    strValues.sort()
    intValues.forEach((value, index)=>{
        if(index === (intValues.length - 1)){
        }else if((value + 1) !== intValues[index+1]){
            intValuesConsecutive  = false
        }
    })
    if(intValuesConsecutive === true){
        if(intValues.length === 5){
            isStraight = true
        }else if(intValues[0] === 2){
            if(strValues[0] === 'A'){
                isStraight = true
            }
        }else if(intValues[0] === 7){
            if(strValues[0] === 'J'){
                isStraight = true
            }
        }else if(intValues[0] === 8){
            if(strValues[0] === 'J' && strValues[1] === 'Q'){
                isStraight = true
            }
        }else if(intValues[0] === 9){
            if((strValues[0] === 'J') && (strValues[1] === 'K') && (strValues[2] === 'Q')){
                isStraight = true
            }
        }else if(intValues[0] === 10){
            if((strValues[0] === 'A') && (strValues[1] === 'J') && (strValues[2] === 'K') 
            && (strValues[3] === 'Q')){
                isStraight = true
                isRoyal = true
            }
        }
    }
    return [isStraight, isRoyal]
}

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