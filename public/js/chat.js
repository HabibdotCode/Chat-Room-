const socket = io();

//creating constants for button and form states
const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//getting the information of the user through the query strings - by makin guse of qs-min.js and location.search method
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

//code for auto scrolling behaviour
const autoscroll = () => {
    const $newMessage = messages.lastElementChild;
    
    //height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = messages.offsetHeight;

    //getting the height of messsage container
    const containerHeight = messages.scrollHeight;

    //how far til the user have scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight;
    }
}

//following code is for every client whenever they enter in the chatroom or gets connected to our server
socket.on('message', (message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm  a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

//creating another handler for location message - for dynamic purposes
socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate,{
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm  a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

//setting the handler for roomData event from the server
socket.on('roomData', ({room, users}) => {
    // console.log(room);   only for testing
    // console.log(users);  only for testing

    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    });

    document.querySelector('#sidebar').innerHTML = html;

})

//setting the logic/code whenever the client sends a message
document.querySelector('#message-form').addEventListener('submit', (event)=>{
    event.preventDefault();

    //we are briefly stopping the button working..after milliseconds, it will work again
    messageFormButton.setAttribute('disabled', 'disabled');
    
    const message = document.querySelector('input').value;
    socket.emit('sendMessage', message, (msg)=>{

        //here we are removing the disabled button, and adding back to its previous state to work again
        messageFormButton.removeAttribute('disabled');

        //clearing the input field - otherwise the message would stay there, we want to clean it once message has been sent
        messageFormInput.value = '';


        //checking if foul condition was true or false, if true, then :
        if(msg){
            return console.log(msg);
        }
        //otherwise, we are sending acknowledgements to the client as usual
        console.log("Sent message")
    });
});



const sendLocationButton = document.querySelector('#send-location');

const messages = document.querySelector("#messages");



//setting the code for client side for sending the location
document.querySelector('#send-location').addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Sorry! Your browser does not support geolocation API');
    }

    //briefly stopping the button functionality, like we did for message
    sendLocationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition((location)=>{
        console.log(location);
        const position = {
            lat: location.coords.latitude,
            long: location.coords.longitude
        }
        socket.emit('sendLocation', position, () => {
        console.log("Location shared!");
        //after sharing the location, we need to enable the button so that it is able to send another location
        sendLocationButton.removeAttribute('disabled');
    });
    })
});

socket.emit('join', ({username, room}), (error) => {
    if(error){
        alert(error);
        location.href = '/';
    }
})