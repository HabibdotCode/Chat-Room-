const users = [];

const addUser = ({id, username, room}) => {
    //cleaning/trimming the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //now validating the username and room details - make sure they are correct and provided by the user
    if(!username || !room){
        return {
            error: 'Username and room must be provided'
        }
    }

    //check for existing user - if the username with same name already exists - deny the request/entry into the room
    const existingUser = users.find((user)=>{
        return user.room === room && user.username===username;
    });

    if(existingUser){
        return {
            error: 'Username already taken. Please try another.'
        }
    };

    const user = {id, username, room};
    users.push(user);
    return {user}
};

//removing a user from the room
const removeUser = (id) => {
    const index = users.findIndex((user)=> {
        return (user.id == id);
    });

    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
};
const getUser = (id) => {
    return users.find(user => user.id === id) 
};

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room)
};

module.exports = {
    addUser, 
    getUser, 
    getUsersInRoom, 
    removeUser
}
