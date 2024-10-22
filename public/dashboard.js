let socket = io();
let topic_labels="";
let temparray=[];
const wordE = document.getElementById('round_results_checkup');
const container = document.getElementById('container_check');
socket.on('round_results_checkup',(words)=>{
    console.log(words)
        remove_dupe(words.flat()).forEach(element => {
            if(element.result!="فارغ"){
                document.getElementById(element.topic).innerHTML+=`<button type="button" class="results_btns" onclick="word_correct(this,this.value)" value="${element.result}-${element.topic}">${element.result}</button>`
            }
        });
        const btns = document.querySelectorAll('.results_btns');
        btns.forEach(btn => {
            temparray.push({topic:btn.value.split("-")[1],result:btn.value.split("-")[0]});
            btn.remove();
        });
        remove_dupe(temparray.flat()).forEach(element => {
                document.getElementById(element.topic).innerHTML+=`<button type="button" class="results_btns" onclick="word_correct(this,this.value)" value="${element.result}-${element.topic}">${element.result}</button>`
            
        });
    
})
socket.on('results_sent',(data)=>{
    document.getElementById('status').innerText="results_sent"
    data.forEach((element,index) => {
        document.getElementById('status').innerHTML+=`<p>${element.name}:${element.points}: postion : ${index+1}</p>`
    });
})
function word_correct(element,word){
    console.log(word, "word")
socket.emit("admin_correct_word",[word,document.getElementById('force_dupe').checked,document.getElementById('append_db')]);
element.remove();
}
function correcting_finished(){
    socket.emit("admin_correcting_finished");
}

function next_round(){
    temparray=[];
    document.getElementById('status').innerText=""
    container.remove();
    wordE.innerHTML =`<div id="container_check">
    </div>`;
    const topics = document.querySelectorAll('.inputs');
    let data=[];
    results_btns=0;
    topics.forEach(element => {
        if(element.value!=""){
            document.getElementById('container_check').innerHTML+=`<div id="${element.value}" > ${element.value}
            </div>
            <hr>`
            data.push(element.value)
        }
    });
    topic_labels=data;
socket.emit("admin_next_round")
}
function start_game(){
    const topics = document.querySelectorAll('.inputs');
    let data=[];
    topics.forEach(element => {
        if(element.value!=""){
            container.innerHTML+=`<div id="${element.value}" > ${element.value}
            </div>
            <hr>`
            data.push(element.value)
        }
    });
    topic_labels=data;
    socket.emit("admin_start",data);
}
function end_game(){
socket.emit("admin_end_game")
}
function auto_correction(){
    
}
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