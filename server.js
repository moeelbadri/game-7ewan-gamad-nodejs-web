const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const fs = require('fs');
let arabic_chars=['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
let deducted_chars= arabic_chars;
let connections = [];
let games = [];
let gamestarted = false;
let lobby = false;
let round = 0;
let index = 0;
let number_result_sent=0;
let tempresults=[];
let correct_words_db = fs.readFileSync('./db.txt','utf-8');
 correct_words_db = JSON.parse(correct_words_db);
 console.log(correct_words_db)
//fs.writeFileSync("./db.txt",JSON.stringify({words:[],close_words:[]}))
io.on("connect", (data) => {
  console.log("connected user");
});

io.on("connection", (socket) => {
  socket.on("setname", (data) => {
    console.log(data)
    const name = data[0];
    let tempid=Date.now();
    if(name){
        connections.forEach(element => {
          if(element.id==data[1]){
            element.name=name;
            element.socket=socket.id;
            tempid=data[1];
          }
        });
      if(gamestarted){
        games[0].forEach(element => {
          if(element.id==data[1]){
            element.socket=socket.id;
            tempid=data[1];
          }
        });
        socket.emit("rejoin_game",(games));
      }
    }
    let user = { socket: socket.id,id:tempid, name: name, points: 0, state: false ,rounds_results : [],current_round:[]};
    connections.push(user);
    socket.emit("name_registered", user);
  });
  socket.on("disconnect", () => {
    connections = connections.filter(
      (connection) => connection.socket !== socket.id
    );
    console.log(socket.id, "Disconnected from Socket.IO server");
  });
  socket.on("join_game", (data) => {
    if (lobby == false) {
      socket.to(socket.id).emit("state","game already started");
    }
  });
  socket.on("admin_correct_from_db",()=>{
    
  })
  socket.on("admin_correct_word",(word)=>{
    let data = word[0].split("-");
    let dupe=0;
    console.log(data)
    if(word[2]){
      correct_words_db.correct_words.push({topic:data[1],result:data[0]});
    }
    try{
      games[0].forEach(user => {
        //console.log(user.current_round)
        user.current_round[0].forEach(element => {
         // console.log(element ,data)
          if(element.topic==data[1]&&element.result==data[0]){
            dupe++;
          }
        });
      });
      console.log(dupe,"before adding points")
        games[0].forEach(user => {
          user.current_round[0].forEach(element => {
            //console.log(element ,data)
            if(element.topic==data[1]&&element.result==data[0]){
              if(dupe==1){
                if(word[1]){
                  user.points+=5;
                }else{
                  user.points+=10;
                }
              }else if(dupe>1){
                user.points+=5;
              }
              console.log(user,"after adding points")
            }
          });
        });

    }catch(er){
      console.log(er)
    }
  })
  socket.on("admin_correcting_finished",(data)=>{
    let postions =[];
    games[0].forEach(user => {
         user.rounds_results.push(user.current_round);
         let datai = {socket:user.socket,points:user.points,name:user.name}
         postions.push(datai);
         user.current_round=[];
    });
    console.log(postions ,"before sorting");
    const sorted_players = sort_players(postions);
    console.log(sorted_players," after sorting")
    sorted_players.forEach((element,index) => {
       socket.to(element.socket).emit("update_stats",[element.points,(index+1)]);
    });
    socket.emit("results_sent",sorted_players)
 })
  socket.on("admin_next_round",(data)=>{
    tempresults=[];
    round++;
    number_result_sent=0;
    if(games[0].length==index){
      index=0;
    }
    try{
      fs.writeFileSync("./db.txt",JSON.stringify(correct_words_db))
    }catch(er){
      console.log(er)
    }
    try{
      console.log(games[0][index])
      io.emit("next_round",games[0][index].name);
      socket.to(games[0][index++].socket).emit("pick_the_char",(deducted_chars));
    }catch(er){
      console.log(err)
    }
  })
  socket.on("admin_start", (data) => {
    gamestarted=true;
    index=0;
    let Data = connections.filter((conection)=>conection.socket != socket.id )
    let game=[];
    games=[];
    game.push(Data);
    game.push(data);
    games=game;
    console.log("game started",(data));
    io.emit("game_topics",(data));
    try{
      //console.log(games[0][index])
      socket.to(games[0][index++].socket).emit("pick_the_char",(deducted_chars));
    }catch(er){
      console.log(er)
    }
  });
  socket.on("admin_end_game",()=>{
    console.log("game ended")
    round = 0;
    index = 0;
    deducted_chars = arabic_chars;
    games="";
    gamestarted=false;
    connections.forEach(element => {
      if(element.socket!=socket.id){
        socket.to(element.socket).emit("end_game")
      }
    });
  })

  socket.on("user_finished", (data) => {
    games[0].forEach(user => {
      //console.log(data[1],user.id)
      if(user.id==data[1]){
        if(number_result_sent++==0){
          io.emit("round_finished",[user.name,user.id])
        }
        if(user.current_round.length==0){
          user.current_round.push(data[0])
          tempresults.push(data[0])
        }
        console.log("user_finished_first",user.name);
      }
    });
    //console.log(remove_dupe(tempresults.flat())," remove dupe");
    io.emit("round_results_checkup",remove_dupe(data[0]));
    console.log("printall")
    console.log(tempresults,games[0])
  });
  socket.on("after_user_finish",(data)=>{
    games[0].forEach(user => {
      if(user.id==data[1]){
        if(user.current_round.length==0){
        console.log("after_user_finished",user.name);
        user.current_round.push(data[0])
        tempresults.push(data[0])
      }
    }
    });
   // console.log(remove_dupe(tempresults.flat())," remove dupe");
    io.emit("round_results_checkup",tempresults);
  })
  socket.on("admin_finished_checking",(data)=>{
    socket.to(games[0][index++].socket).emit("pick_the_char",(deducted_chars));
  })
  socket.on("char_picked",(data)=>{
    console.log("the char"+data+" picked")
    deducted_chars = deducted_chars.filter((char)=>char != data )
    games.push(data);
    io.emit("round_char",data);
  })
});
function remove_dupe(dupe_words){
  let temp=[];
  dupe_words.forEach(word => {
  temp.push(word);
  let temparray=[];
  temparray.push(word)
  dupe_words.forEach(element => {
      if(element.topic==word.topic&&element.result==word.result){
      }else{
          temparray.push(element);
      }
  });
  dupe_words = temparray;
  temp = dupe_words;
});
return temp;
}
function sort_players(positions){
  if(positions.length==1){
    return positions;
  }
for(let i =0; i<positions.length;i++){
  for(let p = i;p<positions.length;p++){
    if(positions[0].points<positions[1].points){
      let temp = positions[0];
      positions[0]=positions[1]
      positions[1]= temp;
    }
  }
}
return positions;
}
app.use(express.static(__dirname + "/public"));

server.listen("80", () => {
  console.log(`Server running on port  0.0.0.0:80`);
});
