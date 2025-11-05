import axios from "axios";
const res = await axios.post(
  "https://rest.clicksend.com/v3/sms/send",
  {
    messages: [
      {
        source: "nodejs",
        body: "Testing from Node",
        to: "+639383850347",
        from: "ClickSend",
      },
    ],
  },
  {
    auth: {
      username: "l9jmpaz@gmail.com ",
      password: "B5E9D64A-BB6E-AAD1-CAD8-636C3C8FD535",
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }
);
console.log(res.data);