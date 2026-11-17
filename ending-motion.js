export const ENDING_DURATION=8;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function endingPose(seconds,reduced=false){
 const t=Math.max(0,seconds),kneel=smooth((t-.45)/1.1),clutch=smooth((t-4.25)/.65),settle=smooth((t-6.1)/1.2);
 return {
  stage:t<.7?'notice':t<4.25?'cry':t<6.5?'scream':'settle',
  height:1.95-1.21*kneel+.12*clutch,
  pitch:-.065-1.27*kneel+.38*clutch-.1*settle,
  clutch,kneel,
  shake:reduced?0:t<.8?.018:t>=4.4&&t<6.25?.027:0,
  tearRate:t<1.15?0:t<4.5?62:t<6.7?28:10,
  caption:t<.7?'나… 고소당한 거야?':t<4.25?'난 확인만 하려고 했는데…':t<6.5?'으아아아악!':'감독만 하러 왔는데…',
  complete:t>=ENDING_DURATION
 };
}
