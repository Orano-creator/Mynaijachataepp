const contractSource = `


payable contract Chat  =
  
    
  record music = 
    {
    owner: address,
    id : int,
    message : string,
    time : int
    }

  record game  =
    {
    gameowner: address,
    gameid : int,
    gamemessage : string,
    gametimestamp : int 

    }
    
  record state = {
    musics : map(int, music),
    games : map(int,game),

    gamelength : int,

    musiclength : int}
    
  entrypoint init() = { 
    musics = {},
    games = {},
    musiclength = 0,
    gamelength = 0 }
  //returns lenght of chats in music group
  entrypoint musicLength() : int = 
    state.musiclength 
//returns lenght of chats in game group
  entrypoint gameLength() : int = 
    state.gamelength 
    
    // gets chats inmusic group
  entrypoint getMusic(index : int) = 
    switch(Map.lookup(index, state.musics))
      None => abort("music message doesnt exist")
      Some(x) => x  

    // gets chats in game groups
  entrypoint getGame(index : int) = 
    switch(Map.lookup(index, state.games))
      None => abort("game message doesnt exist")
      Some(x) => x  

    // sends message to the music group
  payable stateful entrypoint messageMusic(message' : string) = 
    let time' = Chain.timestamp
    let newMusic = {
      id = musicLength()+1,
      owner  = Call.caller,
      message = message',
      time = time'}
    
    let index = musicLength() + 1
    put(state{musics[index] = newMusic, musiclength = index})

    // sends message to the game group
  payable stateful entrypoint messageGame(message' : string) = 
    let timestamp = Chain.timestamp
    let newGame = {
      gameid = gameLength()+1,
      gameowner  = Call.caller,
      gamemessage = message',
      gametimestamp = timestamp}
    
    let index = gameLength() + 1
    put(state{games[index] = newGame, gamelength = index})
    
  
    // to join a room
  payable stateful entrypoint joinroom() = 
    Chain.spend(Contract.address, 1000000)  
  
    `;


const contractAddress = 'ct_kqGd1tJHSZi2mTKwTYbHX4CWM4vAUD8kABj3uzmPzjz9DdG75';
var gameChatArray = [];
var musicChatArray =[];
var client = null;




function renderGame() {
    
    var template = $('#template').html();

    Mustache.parse(template);
    var rendered = Mustache.render(template, {
        gameChatArray
    });




    $('#game').html(rendered);
    console.log("rendered")
}

function renderMusic() {
    
  var template = $('#templateMusic').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
      musicChatArray
  });




  $('#music').html(rendered);
  console.log("rendered")
}
// //Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
    //Create a new contract instance that we can interact with
    const contract = await client.getContractInstance(contractSource, {
        contractAddress
    });
    
    const calledGet = await contract.call(func, args, {
        callStatic: true
    }).catch(e => console.error(e));
    
    const decodedGet = await calledGet.decode().catch(e => console.error(e));
  
    return decodedGet;
}

async function contractCall(func, args, value) {
    const contract = await client.getContractInstance(contractSource, {
        contractAddress
    });
    //Make a call to write smart contract func, with aeon value input
    const calledSet = await contract.call(func, args, {
        amount: value
    }).catch(e => console.error(e));

    return calledSet;
}

$("#gamesection").hide();
$("#musicsection").hide();

window.addEventListener('load', async () => {
    $(".spinner").fadeIn();

    $("#gamesection").hide();
    $("#musicsection").hide();


    client = await Ae.Aepp()

    musicLength = await callStatic('musicLength', []);
    gameLength = await callStatic('gameLength', []);


    for (let i = 1; i <= musicLength; i++) {
        const chats = await callStatic('getMusic', [i]);

        console.log("for loop reached", "pushing music chats to array")

        musicChatArray.push({
            id : chats.id,
            message : chats.message,
            timestamp: new Date(chats.timestamp),
            owner :chats.owner



        })
    }

    for (let i = 1; i <= gameLength; i++) {
      const chats = await callStatic('getGame', [i]);

      console.log("for loop reached", "pushing game chats to array")

      gameChatArray.push({
          id : chats.gameid,
          message : chats.gamemessage,
          timestamp: new Date(chats.gametimestamp),
          owner :chats.gameowner



      })
  }
    
    $('.spinner').fadeOut();
});




$('#gameGroup').click(async function () {
    console.log("Gaming clicked")
    $(".spinner").fadeIn();

    await contractCall('joinroom', [], 1000)
    

    $("#musicsection").hide();
    $("#game").show();
    $("#gamesection").show();

    renderGame();

    $('.spinner').fadeOut();

    console.log("SUCCESSFUL")

});

// shows music group content

$('#musicGroup').click(async function () {
  console.log("Music clicked")
  $(".spinner").fadeIn();

  $("#gamesection").hide();
  $("#musicsection").show();
  $("#music").show();


  await contractCall('joinroom', [], 1000)


  renderMusic();

  $('.spinner').fadeOut();

  console.log("Music room SUCCESSFUL")

});

// Send game group messages

$('#sendGame').click(async function () {
  console.log("sending game message")
  $(".spinner").fadeIn();

  var message  = ($('#usermessage').val())
  console.log(message)

  await contractCall('messageGame', [message], 0)
  i = await callStatic('gameLength', [])
  newmsg = await callStatic('getGame', [i]);

  gameChatArray.push({
    message: message,
    owner : newmsg.gameowner,
    timestamp : Date(newmsg.gametimestamp)
  })
  console.log(newmsg.gameowner)
  console.log(newmsg.gametimestamp)


  renderGame();

  $('.spinner').fadeOut();

  console.log("message sent ")

});

// Send music chat messages

$('#sendMusic').click(async function () {
  console.log("sending music message")
  $(".spinner").fadeIn();

  var message  = ($('#musicmessage').val())
  console.log(message)

  await contractCall('messageMusic', [message], 0)
  i = await callStatic('musicLength', [])
  newmsg = await callStatic('getMusic', [i]);

  musicChatArray.push({
    message:message,
    owner : newmsg.owner,
    timestamp : Date(newmsg.time)
  })
  console.log(newmsg.owner)
  console.log(newmsg.time)


  renderMusic();

  $('.spinner').fadeOut();

  console.log("message sent ")

  // document.getElementById("confirmation").innerHTML = " Reservation purchased Successfully"

  // $.colorbox({html:"<h1>Reservation booked successfully</h1>"});
});