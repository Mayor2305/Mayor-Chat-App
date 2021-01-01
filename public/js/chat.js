const socket = io();
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = document.querySelector('input');
const $messageFormButton = document.querySelector('button');

const $messages = document.querySelector('#messages');
//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const LocationTemplate = document.querySelector('#Location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//options
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoscroll = () =>{
    //new message
    const $newmessage = $messages.lastElementChild;

    //height of the new message
    const newMessageStyles = getComputedStyle($newmessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin;
    
    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;
    
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message)=>{
    console.log(message);
    const html= Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

})

socket.on('locationMessage', (message)=>{
    const html = Mustache.render(LocationTemplate,{
        username: message.username,
        url : message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('clientMessage', message,(error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error){
           return console.log(error);
        }
        console.log('Message delivered');
    });

})


const $locationButton = document.querySelector('#send-location');

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
       
        return alert('Geolocation not supported');
        
    }

    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('send-location', {
            latitude : position.coords.longitude, 
            longitude : position.coords.latitude},()=>{
                $locationButton.removeAttribute('disabled');
                console.log('Location Shared');
            });
    });    
})

socket.emit('join', {
    username,
    room
},(error)=>{
    if(error)
    {
        alert(error);
        location.href = '/';
    }
})