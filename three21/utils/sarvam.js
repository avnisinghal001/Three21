import { SarvamAIClient } from "sarvamai";
const sarvam = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY || "sk_atib2z46_4ZD4y9qiq7q2kyNz0TmceP9V"
});
console.log('Sarvam AI Client initialized:', sarvam);
export default sarvam;