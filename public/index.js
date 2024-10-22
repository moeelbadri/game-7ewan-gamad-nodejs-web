let players = [];
let socket = io();
let choosen_char = "";
let topics;
let next_round_status = false;
let char_picked=false;
// document.getElementById('pick_char').open=true;

socket.on("name_registered", (data) => {
  console.log(data)
  document.getElementById("username").innerText=`${data.name} : اسمك`
 document.getElementById("starting").open = false;
 localStorage.setItem("id",data.id);
});
socket.on("connect", (data) => {
  document.getElementById('connection_status').innerText="الحالة : متصل"
  console.log("server connected");
  get_data();
});

socket.on("disconnect", (data) => {
  document.getElementById('connection_status').innerText="الحالة : غير متصل"
  console.log("server disconnected");
});
socket.on("round_finished", (data) => {
  console.log("round_finished",data)
  console.log(localStorage.getItem("id")!=data[1])
 if(localStorage.getItem("id")!=data[1]){
  socket.emit("after_user_finish", [get_all_inputs(false),localStorage.getItem("id")]);
 }
  document.querySelectorAll(".inputs").forEach(element => {
    element.setAttribute("readonly","")
  });
  document.getElementById('status').innerText=`${data[0]} انتهى اللاعب 
  يرجى انتظار النتائج|`
  window.scrollTo({
    top:50,
    behavior:"smooth",
  });
});
socket.on("next_round",(data)=>{
  char_picked=false;
  document.querySelectorAll(".inputs").forEach(element => {
    element.value="";
  });
  document.getElementById('status').innerText=`waiting for ${data} to pick the char`
})
socket.on("update_stats",(data)=>{
  document.getElementById("points").innerText=`${data[0]} : نقاطك`
  document.getElementById("position").innerText=`${data[1]} : ترتيبك`
  document.getElementById('status').innerText='waiting for round to start'
})
socket.on("end_game",()=>{
  window.location.reload(true);
})
socket.on("pick_the_char", (data) => {
  const old_chars = document.querySelectorAll('.characters');
  old_chars.forEach(element => {
    element.remove();
  });
  document.getElementById("pick_char").open = true;
  data.forEach((element) => {
    document.getElementById(
      "chars"
    ).innerHTML += `<button onclick="set_char(this.value)" value="${element}" class="characters" type="button"><h2>${element}</h2></button>`;
  });
  pick_random_char(data);
});
socket.on("round_char",(data)=>{
  char_picked=true;
  next_round_status=true;
  document.querySelectorAll(".inputs").forEach(element => {
    element.removeAttribute("readonly")
  });
  document.getElementById('status').innerText=''
  document.getElementById("pick_char").open = false;
  choosen_char=data;
  document.getElementById('char_label').innerText=`الحرف : ${data}`
})
socket.on("game_topics",(data)=>{
	document.getElementById("new_name_D").remove();
  topics=data;
  console.log(topics)
  const topic = document.getElementById('topics');
  topics.forEach(element => {
    if(!document.getElementById(element)){
      topic.innerHTML+=`<h1 class="labels">${element}</h1>       
      <input class="inputs" id='${element}' type="text" autocomplete="off">`
    }
})
});
socket.on("rejoin_game",(data)=>{
  next_round_status=true;
  topics=data[1];
  document.getElementById('status').innerText=''

  document.getElementById("pick_char").open = false;
  choosen_char=data[2];
  document.getElementById('char_label').innerText=`الحرف : ${data[2]}`
  console.log(data[1])
  const topic = document.getElementById('topics');
  topics.forEach(element => {
    if(!document.getElementById(element)){
      topic.innerHTML+=`<h1 class="labels">${element}</h1>       
      <input class="inputs" id='${element}' type="text" autocomplete="off">`
    }
  });
})
function get_data() {
  let name = localStorage.getItem("name");
  let id =  localStorage.getItem("id");
  console.log(name,id);
  if (name&&id) {
    socket.emit("setname", [name,id]);
    // document.getElementById('starting').open=false;
  } else {
    document.getElementById("starting").open = true;
  }
}
function send_answers() {
  console.log(next_round_status)
  if(next_round_status){
    let results = get_all_inputs(true);
    if (results != false) {
      next_round_status=false;
      document.getElementById("empty").innerText = "";
      socket.emit("user_finished", [results,localStorage.getItem("id")]);
    }
  }
}
function get_all_inputs(first) {
  let results = [];
  let empty = false;
  document.getElementById("empty").innerText="";
  document.querySelectorAll(".inputs").forEach((element) => {
    if(first){
      if (element.value == "") {
        empty = true;
        document.getElementById("empty").innerHTML += `<p>قم بتعبئة ${element.id}</p>`;
        return false;
      }else if (element.value[0] != choosen_char) {
        empty = true;
        document.getElementById("empty").innerHTML += `<p>قم بتاكد من  ${element.id}</p>`;
        return false;
      }
    }
    console.log(element.value.split(""))
    if(element.value==""){
      element.value="فارغ"
    }
    let tempchar="";
    element.value.split("").forEach((char,index) => {
      console.log(char,char=="أ")
      if(char=="أ"){
        char='ا';
      }
      tempchar+=char;
    });
    element.value=tempchar;
    if(element.value[0]==" "){
      element.value=element.value.split(" ")[1];
    }
    let result = { topic: element.id, result: element.value };

    console.log(result);
    results.push(result);
  });
  if (empty) {
    return false;
  }else{
    return results;
  }
}
function set_char(char) {
  socket.emit("char_picked",char);
}
function setname() {
  console.log(document.getElementById("name"))
  localStorage.setItem("name", document.getElementById("name").value);
  console.log(localStorage.getItem("name"))
  socket.emit("setname", [localStorage.getItem("name")]);
}
function setnewname(){
  console.log(document.getElementById("new_name_I"))
  localStorage.setItem("name", document.getElementById("new_name_I").value);
  console.log(localStorage.getItem("name"))
  socket.emit("setname", [localStorage.getItem("name")]);
  document.getElementById("new_name_D").remove();
}
function pick_random_char(chars){
setTimeout(async () => {
  if(!char_picked){
    set_char(chars[Math.floor(Math.random()*chars.length)]);
  }
}, 3000);
}