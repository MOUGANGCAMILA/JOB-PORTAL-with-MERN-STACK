# JOB-PORTAL-with-MERN-STACK
A job management system built using MongoDB, Express, React and Node.js.

"###" is the different features required for User registration (admin or user) in an automatic testing tool like POSTMAN ( the  one i used )

###


{
"firstName": "Adminh0 (e)",
"lastName": "Userh0 (e)",
"email": "admin506er@gmail.com (e)",
"password": "5StrongPass123!0h (e)",
"passwordConfirmation": "5StrongPass123!0h (e)",
"role": 1 (e),                              ### 1 = admin , 0 = user
"securityQuestions": [
{ "question": "What is your mother's maiden name?", "answer": "Smith (e)" },
{ "question": "What was your first pet's name?", "answer": "Rex (e)" },
{ "question": "What city were you born in?", "answer": "Lagos (e)" }
]
}

# (e) = editable

###


# install node  modules and all the dependencies in the package.json files( install it in the backend or frontend folder)

# create a ".env" file in the backend folder and paste "

ATLAS_URI=mongodb+srv://xxxx:xxxx@xxxxx.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=xxxxx ## MongoDB connection string (Connecting with MongoDB Driver online )

PORT=4900  # port number

"

# you can add the codes below if you want to use an SMTP Email delivery service to send a reset link for FORGOT PASSWORD "

JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.hostname(e.g: Gmail, Yahoo, etc).com
SMTP_PORT=587 # port number
SMTP_USER=your_email@gmail.com  # senders email
SMTP_PASS=xxxxxx # your gmail account password or your gmail app password
SMTP_FROM="Gmail <your_email@gmail.com>"

"

# frontend localhost " http://localhost:3000 "

# JOB PORTAL 1 
  it has working FORGOT PASSWORD, but the role takes only 0, therefore admin login does not work

# JOB PORTAL 2
   it has a working role ( role =  0 {user} or 1 {admin} for User registration )  but the forgot password does not work. The admin login does not also work


   ### RUN code
    ]1]  if you are in JOB PORTAL 1 or JOB PORTAL 2, go to backend folder( JOB PORTAL 1\backend or JOB PORTAL 2\backend) and run " npm start "
    ]2]  if you are in JOB PORTAL 1 or JOB PORTAL 2, go to frontend folder( JOB PORTAL 1\frontend or JOB PORTAL 2\frontend) and run " npm start "
