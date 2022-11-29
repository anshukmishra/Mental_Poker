//connecting to index.js server
const socket = io('http://localhost:8000');


const joiningForm = document.getElementById('joining-form');
let form;
let messageInput;
let messageContainer;

function waitForTheNextPlayer(room,username,count)
{
    const bodyElement = document.getElementsByTagName("body")[0];
    bodyElement.innerHTML=`<div className="flex-centered">
    <div className="login flex-centered-column">
      <h2>
        You have joined room <span> ${room} </span>
      </h2>
      <h2>there are currently ${count} player(s) in this room</h2>
      <h1>Start the game?</h1>
      <div class="actions">
        <div class="button">
          <button class="startButton">
            start
          </button>
        </div>
        <div class="button">
          <button class="leaveButton">
            Leave room
          </button>
        </div>
      </div>
    </div>
  </div>`

  let leave_button = document.getElementsByClassName("leaveButton")[0];
  console.log(leave_button);

  leave_button.addEventListener("click",function(){
    console.log("clicked the leave button");
    socket.emit('leave_room', { room : room, name : username });
    loginPage();
  });

  let start_button = document.getElementsByClassName("startButton")[0];
  console.log(start_button);

  start_button.addEventListener("click",function(){
    console.log("clicked the start button");
    if(count==1)
    {
      alert("you need at least 2 players to start the game");
    }
    else
    {
      socket.emit('game_started', { room : room, name : username });
      alert("game started");
    }
    // socket.emit('leave_room', { room : room, name : username });
    // loginPage();
  });
}

// var audio = new Audio('./ting.mp3');
// audio.muted=true;
// console.log(audio.muted);

let room;
let username;

function loginPage()
{
  document.body.innerHTML=`<div class="flex-centered">

  <div class="login flex-centered-column">
      <h1>Teenpatti Card Game</h1>
      <form id="joining-form">
          Name : 
          <input type="text" name="name"/>
          Room No. :
          <input type="text" name="room"/>
          <input type="submit" />
      </form>
  </div>

  <div className="rules flex-centered-column">
    <h1>Rules</h1>
    <ol>
        <li>Each player gets dealt 5 cards which only they can see</li>
        <li>There is one open card face up on the board along with the deck</li>
        <li>The immediate objective for the player is to reduce the total value of your hand.</li>
        <li>One after the other players play their turn in which they can throw any single card or pair of cards with the same value.</li>
        <li>After throwing a card or a pair of cards the player <span>has to</span> either pick up a card from the deck <span>or</span> pick up the open card if and only if they have at least one card to pair up the open card with.</li>
        <li>If the player picks up the open card in their turn then they <span>must throw</span> the pair at their next turn.</li>
        <li>The round ends when one of the player <i>declares</i> their hand and two outcomes can occur</li>
        <li>If the total value of the hand of the player who <i>declared</i> is less than any of the other players then the player wins the round and every other player get the value of their hand added to the total points.</li>
        <li>If any of the other players have a total value lower than that of the player who has <i>declared</i> then the declarer is <i>caught</i> and he gets a penalty of 50 added to their total points.</li>
        <li>The goal of each round is to reduce the total value of you hand and declaring if you think your hand is lower than everyone else's or wait for someone else to declare and see if your hand is lower than their's</li>
        <li>If after any turn a player has only one card left with them and the card is the <i>Ace</i> of any suit then the player must cumpulsorily declare on their next turn.</li>
        <li>After the desired number of rounds the rankings of the players are decided based on their points in the table. The lower the points of the player the higher their rank. The player with the lowest total points on the table wins.</li>
        <li><span>Value of each card</span>: every number card has the value of their number. Ace is 1. Every face card, i.e., King, Queen, and Jack, have the value 10.</li>
    </ol>
  </div>
</div>`;
}

const append = (message, position)=>{
    console.log(message);
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

joiningForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  console.log(e.target.name.value);
  console.log(e.target.room.value);
  username=e.target.name.value;
  room=e.target.room.value;
  if(username)
  {
      console.log(socket);
      // socket.current.emit('join_room', { room : 1, username });
      socket.emit('join_room', { room : room, name : username });
      // socket.emit('user-joined', {username,room_no : 1});
  }
})

// if(username)
// {
//     console.log(socket);
//     // socket.current.emit('join_room', { room : 1, username });
//     socket.emit('join_room', { room : room, name : username });
//     // socket.emit('user-joined', {username,room_no : 1});
// }

socket.on("player_count", (count) => {
    console.log(count);
    if(count <= 2)
    {
      waitForTheNextPlayer(room,username,count);
    }
    else
    {
      socket.emit('leave_room', { room : room, name : username });
      alert("Room is completely field already");
    }
});

socket.on("stop_joining", (count) => {
  alert("Room is completely field already");
});

socket.on('receive', data=>{
    if(data.name != username)
    {
        append(`${data.name }: ${data.message}`, 'left');
    }
})

function startGameUI(cards)
{
  console.log(cards);
  document.body.innerHTML=`
  <div class="main-container">
        <div class="card-container">
            <h3>${username} Cards</h3>
            <div class="Alice-Cards">
                <div class="card">
                    <img src="./images/${cards[0]}.jpg" alt="card" height="200" width="120">
                </div>
                <div class="card">
                    <img src="./images/${cards[1]}.jpg" alt="card" height="200" width="120">
                </div>
                <div class="card">
                    <img src="./images/${cards[2]}.jpg" alt="card" height="200" width="120">
                </div>
            </div>

            <h3>Opponent Cards</h3>
            <div class="Bob-Cards">
                <div class="card">
                    <img src="./images/card background.jpg" alt="card" height="200" width="120">
                </div>
                <div class="card">
                    <img src="./images/card background.jpg" alt="card" height="200" width="120">
                </div>
                <div class="card">
                    <img src="./images/card background.jpg" alt="card" height="200" width="120">
                </div>
            </div>
        </div>
        <div class="msg-container">
            <h6>You can chat here..</h6>
            <div class="container">
            </div>
            <div class="send">
                <form action="#" id=send-container>
                    <input type="text" name="messageInp" id="messageInp">
                    <button class="btn" type="submit">Send</button>
                </form>
            </div>
        </div>
    </div>`;

    form = document.getElementById('send-container');
    messageInput = document.getElementById('messageInp');
    messageContainer = document.querySelector('.container');
    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        console.log(e);
        const message = messageInput.value;
        append(`You: ${message}`, 'right');
        socket.emit('send', {room , name : username, message});
        messageInput.value = '';
    });
}

socket.on('receive_card', data=>{
  startGameUI(data.cards);
})

// socket.on('user-joineddd', username=>{
//     append(`${username} joined the chat`, 'right');
// })

socket.on('left', name=>{
    append(`${name } left the chat`, 'left');
})

// loginPage();