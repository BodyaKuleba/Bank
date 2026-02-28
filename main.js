let cardIDList = JSON.parse(localStorage.getItem("AllCards")) || []
const CardObject = document.querySelector(".card")
let activeCard = null
let onCardScreen = false
let onHistoryScreen = false

const cardImagesList = [
    "Images/CreditCard1.png",
    "Images/CreditCard2.png",
    "Images/CreditCard3.png",
    "Images/CreditCard4.png",
    "Images/CreditCard5.png",
    "Images/CreditCard6.png",
    "Images/CreditCard7.png",
    "Images/CreditCard8.png",
    "Images/CreditCard9.png",
]
function createCard(name, id) {
    let cardNum = ""
    for (let i = 0; i < 16; i++) {

        if (i > 0 && i % 4 === 0) {
            cardNum += " "
        }

        let num = Math.floor(Math.random() * 10)
        cardNum += num
    }
    let cardImgIndex = Math.floor(Math.random() * cardImagesList.length)
    let selectedCardImg = cardImagesList[cardImgIndex]

    let newCard = {
        cardID: cardNum,
        cardName: name,
        cardBalance: localStorage.getItem(`LastBalance${id}`) || 100,
        cardLimit: localStorage.getItem(`LastBalance${id}`) || 100,
        cardImg: selectedCardImg,
    }

    cardIDList.push(newCard)
    console.log(cardIDList)
}

function fillOutCard(id) {
    if (id < 0 || !cardIDList[id]) return
    const CardName = document.querySelector("#CardName")
    const CardID = document.querySelector("#CardID")
    const MoneyDisplay = document.querySelector("#MoneyDisplay")

    CardName.textContent = cardIDList[id].cardName
    CardID.textContent = cardIDList[id].cardID
    MoneyDisplay.textContent = `${cardIDList[id].cardBalance}$`
    CardObject.style.backgroundImage = `url(${cardIDList[id].cardImg})`
}
function renderCards() {
    const cardContainer = document.querySelector(".CardDiv")
    cardContainer.innerHTML = ""

    cardIDList.forEach((card, index) => {
        const cardItem = document.createElement("div")
        cardItem.classList.add("CardItem")

        if (activeCard && activeCard.getCardOptions().id === index + 1) {
            cardItem.classList.add("selectedCard")
        }

        cardItem.innerHTML = `
            <img src="${card.cardImg}" alt="Credit Card">
            <h3>${card.cardBalance}$</h3>
            <button class="useCardBtn">Use</button>
        `

        cardItem.addEventListener("click", () => {
            selectCard(index)
        })

        cardContainer.appendChild(cardItem);
    })

    const addBtn = document.createElement("button")
    addBtn.id = "plusCardBtn"
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'

    addBtn.addEventListener("click", () => {
        const wrap = document.querySelector(".wrap")
        const defaultDisplay = document.querySelector(".defaultDisplay")
        const cardDisplay = document.querySelector(".cardDisplay")

        wrap.style.filter = "blur(10px) brightness(0.8)"
        defaultDisplay.style.display = "flex"
        cardDisplay.style.display = "none"
        CreateCardDiv.style.display = "flex"
    })

    cardContainer.appendChild(addBtn)
}

function selectCard(index) {
    activeCard = userCard(index + 1)
    fillOutCard(index)
    activeCard.updateMoneyCount()
    renderCards()
}
function userCard(id) {

    const index = id - 1

    if (!cardIDList[index]) {
        console.error(`Card with ID ${id} not found in cardIDList.`)
        return null
    }

    let balance = cardIDList[index].cardBalance || 100
    let transactionLimit = cardIDList[index].cardLimit || 100
    let historyLogs = JSON.parse(localStorage.getItem(`HistoryLogs${id - 1}`)) || []
    localStorage.setItem("AllCards", JSON.stringify(cardIDList))

    function recordOperation(type, amount, time) {
        historyLogs.push({
            operationType: type,
            credits: amount,
            operationTime: time,
        })
        localStorage.setItem(`HistoryLogs${id}`, JSON.stringify(historyLogs))
    }

    function messageSystem(textContent, duration) {
        let timeoutID
        clearTimeout(timeoutID)
        const messageDiv = document.querySelector("#messageDiv")
        const messageText = document.querySelector("#messageText")

        messageText.textContent = textContent
        messageDiv.style.left = 0
        timeoutID = setTimeout(function () {
            messageDiv.style.left = "-100%"
        }, duration)
    }

    function saveToStorage() {
        cardIDList[id - 1].cardBalance = balance
        cardIDList[id - 1].cardLimit = transactionLimit

        localStorage.setItem("AllCards", JSON.stringify(cardIDList))

        localStorage.setItem(`LastBalance${id}`, balance)
        localStorage.setItem(`LastLimit${id}`, transactionLimit)
    }

    return {
        getHistoryLogs() {
            return historyLogs
        },
        deleteLog(index) {
            historyLogs.splice(index, 1)
            localStorage.setItem(`HistoryLogs${id}`, JSON.stringify(historyLogs))
            this.loadHistoryLogs()
        },
        getCardOptions() {
            return {
                id,
                balance,
                transactionLimit,
                historyLogs
            }
        },
        putCredits(amount) {
            if (amount === "" || amount == null || amount <= 0) {
                messageSystem("Please enter a valid amount", 2000)
                return
            }
            if (amount > transactionLimit) {
                messageSystem("Amount exceeded your limit", 2000)
                return
            }

            let transformedAmount = Number(amount)
            balance += transformedAmount

            this.updateMoneyCount()
            saveToStorage()
            renderCards()
            recordOperation("Receive credits", transformedAmount, new Date().toLocaleString())
        },
        takeCredits(amount) {
            if (amount < 0) {
                messageSystem("Can't use negative numbers", 3000)
                return
            }

            if (amount == 0) {
                messageSystem("Can't take 0 from balance", 3000)
                return
            }

            if (amount <= transactionLimit && amount <= balance) {
                let transformedAmount = Number(amount)
                balance -= transformedAmount
                this.updateMoneyCount()
                saveToStorage()
                recordOperation("Take credits", amount, new Date().
                    toLocaleString())
            } else if (amount <= transactionLimit && amount > balance) {
                messageSystem("Amount exceeded your balance", 3000)
                return
            } else if (amount > transactionLimit && amount <= balance) {
                messageSystem("Transaction Limit exceeded")
                return
            } else if (amount == null) {
                messageSystem("Can't add nothing to account")
                return
            } else {
                messageSystem("The amount exceeded both the Transaction limit and your Balance")
                return
            }
        },
        setTransactionLimit(amount) {
            if (amount < 0) {
                messageSystem("Can't use negative numbers", 3000)
                return
            }

            if (amount == 0) {
                messageSystem("Can't add 0 to Transaction limit", 3000)
                return
            }

            let transformedAmount = Number(amount)
            transactionLimit = transformedAmount
            recordOperation("Set Transaction limit", transformedAmount, new Date().
                toLocaleString())
        },
        transferCredits(amount, cardID) {
            const tax = 0.005
            const transferAmount = amount * tax + amount

            if (transferAmount <= balance) {
                if (transferAmount > transactionLimit) {
                    console.error("Transaction limit exceeded")
                    return
                }
                this.takeCredits(transferAmount)
                cardID.putCredits(amount)
                recordOperation("Transfered credits", amount, new Date().
                    toLocaleString())

            }
        },
        loadHistoryLogs() {
            const historyDiv = document.querySelector("#HistoryDiv")
            const logs = this.getHistoryLogs()
            let allLogsHTML = ""

            logs.forEach(log => {
                allLogsHTML += `        
        <div class="HistoryLogDiv">
            <div class="topLogDiv">
                <div class="leftLogDiv">
                    <p class="TypeText">${log.operationType}</p>
                    <p class="DataText">${log.operationTime}</p>
                </div>
                <div class="rightLogDiv">
                    <p class="AmountText">${log.credits}$</p>
                </div>
            </div>
            <div class="bottomLogDiv">
                <div class="deleteBtnLog">
                    <i class="fa-solid fa-trash"></i>
                </div>
            </div>
        </div>
    `
            })
            historyDiv.innerHTML = allLogsHTML

            historyDiv.onclick = (e) => {
                const btn = e.target.closest('.deleteBtnLog')
                if (btn) {
                    const logDiv = btn.closest('.HistoryLogDiv')
                    const index = logDiv.getAttribute('data-index')

                    this.deleteLog(index)
                }
            }
        },
        loadLogs() {
            const Toolbar = document.querySelector("#toolbar")
            const HistoryDiv = document.querySelector("#HistoryDiv")
            if (onHistoryScreen == false) {
                this.loadHistoryLogs()
                onHistoryScreen = true
                Toolbar.style.bottom = "-20%"
                HistoryDiv.style.display = "flex"
            } else {
                onHistoryScreen = false
                Toolbar.style.bottom = "0"
                HistoryDiv.style.display = "none"
            }
        },
        updateMoneyCount() {
            const MoneyDisplay = document.querySelector("#MoneyDisplay")
            MoneyDisplay.textContent = `${balance}$`
        }
    }
}

const HistoryBtn = document.querySelector("#HistoryBtn")
const CardBtn = document.querySelector("#CardBtn")

const TakeCreditsBtn = document.querySelector("#TakeCreBtn")
const PutCreditsBtn = document.querySelector("#PutCreBtn")
const SetLimitBtn = document.querySelector("#SetLimBtn")

const MoneyInp = document.querySelector("#MoneyInp")

const NameInp = document.querySelector("#NameInp")

const CreateCardDiv = document.querySelector(".CCDiv")
const CreateCardBtn = document.querySelector("#CCBtn")
const CCConfirmBtn = document.querySelector("#CCConfirmBtn")

const Toolbar = document.querySelector("#toolbar")
const Header = document.querySelector(".header")

const DefaultDisplay = document.querySelector(".defaultDisplay")
const CardDisplay = document.querySelector(".cardDisplay")

const HistoryDiv = document.querySelector("#HistoryDiv")
const CardDiv = document.querySelector("#CardDiv")

if (cardIDList.length !== 0) {
    Toolbar.style.bottom = 0
    Header.style.top = 0
    DefaultDisplay.style.display = "none"
    CardDisplay.style.display = "flex"

    const lastIndex = cardIDList.length - 1
    selectCard(lastIndex)
    renderCards()
}

MoneyInp.addEventListener("keydown", (e) => {
    const invalidChars = ["-", "+", "e", "E"]

    if (invalidChars.includes(e.key)) {
        e.preventDefault()
    }
})

TakeCreditsBtn.addEventListener("mousedown", (e) => {
    if (activeCard) {
        activeCard.takeCredits(MoneyInp.value)
        MoneyInp.value = ""
    }
})

PutCreditsBtn.addEventListener("mousedown", (e) => {
    if (activeCard) {
        activeCard.putCredits(MoneyInp.value)
        MoneyInp.value = ""
    }
})

SetLimitBtn.addEventListener("mousedown", (e) => {
    if (activeCard) {
        activeCard.setTransactionLimit(MoneyInp.value)
        MoneyInp.value = ""
    }
})

HistoryBtn.addEventListener("mousedown", (e) => {
    if (activeCard) {
        activeCard.loadLogs()
    }
})

CardBtn.addEventListener("mousedown", (e) => {
    if (!activeCard) return
    if (!onCardScreen) {
        renderCards()
        CardDiv.style.display = "flex"
        HistoryDiv.style.display = "none"
        onCardScreen = true
    } else {
        CardDiv.style.display = "none"
        onCardScreen = false
    }
})

CreateCardBtn.addEventListener("mouseup", (e) => {
    const defaultDisplay = document.querySelector(".defaultDisplay")
    const cardDisplay = document.querySelector(".cardDisplay")
    const wrap = document.querySelector(".wrap")
    wrap.style.filter = "blur(10px) brightness(0.8)"
    CreateCardDiv.style.display = "flex"
})

CCConfirmBtn.addEventListener("mouseup", (e) => {
    if (NameInp.value.trim() !== "") {
        const defaultDisplay = document.querySelector(".defaultDisplay")
        const cardDisplay = document.querySelector(".cardDisplay")
        const wrap = document.querySelector(".wrap")

        wrap.style.filter = "none"
        defaultDisplay.style.display = "none"
        cardDisplay.style.display = "flex"
        CreateCardDiv.style.display = "none"
        Header.style.top = "0"
        Toolbar.style.bottom = "0"

        const nextID = cardIDList.length + 1
        createCard(NameInp.value, nextID)
        const lastIndex = cardIDList.length - 1
        selectCard(lastIndex)
        NameInp.value = ""
    }
})