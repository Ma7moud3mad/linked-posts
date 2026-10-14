// generate random string for email confirmation token
export function generateOTP() {
  return Math.ceil(Math.random() * 90000 + 100000).toString();
}