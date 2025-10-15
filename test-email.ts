import transporter from "./src/config/email";
transporter.sendMail({
  from: "shiwangiupadhyay332@gmail.com",
  to: "shiwangiupadhyay332@gmail.com",
  subject: "Test OTP",
  text: "OTP is 123456",
}).then(info => console.log("Sent!", info)).catch(console.error);