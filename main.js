"use strict"

let output = document.getElementById("output");
let vars = "";
let funcs = "0+?.A*";
let defs = [];
let doCharOutput = false;
let consts = {};

function run() {
  vars = ""
  funcs = "0+?.A*"
  defs = [];
  output.value = "";
  consts = {'0':0};

  doCharOutput = document.getElementById("outputtype").checked;
  let code = document.getElementById("code").value.split("\n");
  for (let c of code) {
    if (!verifyDef(c)) {
      if (verifyFunc(c)) {
        deFunc(c);
      } else if ( !document.getElementById("errors").checked ) {
        output.value += "Unable to parse: " + c + " ";
        break;
      }
    }
  }
}

function split(str) {
  let ret = [];
  let d=1;
  let snippet = "";
  for (let i=0;i<str.length;i++) {
    switch (str[i]) {
      case '0': d--; break;
      case '+': case '.': break;
      case 'A': d += 2; break;
      case '?': case '*': d += 3; break;
      default:
        let def = defs.filter(x => x[0] == str[i])[0];
        for (let j = 1; j < def.length && !funcs.includes(def[j]) && !def.substring(1, j).includes(def[j]); j++)
          d++;
        d--;
      break;
    }
    snippet += str[i].toString();
    if (d == 0) {
      ret.push(snippet);
      snippet = "";
      d++;
    }
  }
  return ret;
}

function snip(str,id) {
  return deFunc( split(str.substring(1))[id] );
}
function deFunc(str) {
  if (consts[str]) return consts[str];

  //console.log("deFunc("+str+")")
  switch(str[0]) {
    case '0': return 0;
    case '+': return snip(str,0)+1;
    case '.':
      let n = snip(str,0);
      if (doCharOutput) output.value += String.fromCharCode(n);
      else output.value += n + " ";
      return n;
    case '?': return ( snip(str,0) > snip(str,1) ? snip(str,2) : snip(str,3) );
    case 'A': return snip(str,0) + Math.max(0,snip(str,1) - snip(str,2));
    case '*': return snip(str,0)*Math.max(0,snip(str,1)-snip(str,3)) + snip(str,2);
    default: //let the magic happen
      let d = 1;
      let def = defs.filter(x => x[0] == str[0])[0];
      for (let j = 1; j < def.length && !funcs.includes(def[j]) && !def.substring(1, j).includes(def[j]); j++) {
        if (!vars.includes(def[j])) vars += def[j];
        d++;
      }
      let def2 = def.substring(d/*, def.length - d+1*/);
      for (let j = 1; j < d; j++) {
        def2 = def2.replaceAll(def[j], split(str.substring(1))[j-1]);
      }
      return deFunc(def2);
  }
}

function verifyFunc(str) {
  let d=1;
  
  for (let i=0;i<str.length;i++) {
    switch (str[i]) {
      case '0': d--; break;
      case '+': case '.': break;
      case 'A': d += 2; break;
      case '?': case '*': d += 3; break;
      default:
        if (!funcs.includes(str[i])) return false;
        let def = defs.filter(x => x[0] == str[i])[0];
        for (let j = 1; j < def.length && !funcs.includes(def[j]) && !def.substring(1, j).includes(def[j]); j++)
          d++;
        d--;
      break;
    }
    if (d == 0 && i + 1 != str.length) return false;
  }
  return d == 0;
}
function verifyDef(str) { //i have zero clue how this works
  if (funcs.includes(str[0])) return false;
  let tempvars = "";
  let code = "";
  let isConst = true;
  
  for (let i=1;i<str.length;i++) {
    if (funcs.includes(str[i])) {
      code = str.substring(i/*,str.length-i+1*/);
      i = str.length;
    } else {
      tempvars += str[i];
      isConst = false;
    }
  }
  let d=1;
  //console.log("got here", str, tempvars)
  for (let i=0;i<code.length;i++) {
    switch (code[i]) {
      case '0': d--; break;
      case '+': case '.': break;
      case 'A': d += 2; break;
      case '?': case '*': d += 3; break;
      default:
        let def = "";
        if (code[i] == str[0]) {
          def = defs.filter(x => x[0] == code[i])[0];
          if (!def) def = str;
        } else {
          if (!funcs.includes(code[i]) && !tempvars.includes(code[i])) return false;
          def = defs.filter(x => x[0] == code[i])[0]; //beware of array out of bounds errors? but we dont crash in js
        }
        //console.log(str,i,d,code[i],def)
        for (let j = 1; def != undefined && j < def.length && !(funcs + str[0]).includes(def[j])
            && !def.substring(1, j).includes(def[j]); j++) d++;
        d--;
      break;
    }
    if (d == 0 && i + 1 != code.length) return false;
  }
  //console.log("got here2",d)
  if (d != 0) return false;

  for (let i = 0; i < tempvars.length; i++)
    if (!vars.includes(tempvars[i])) vars += tempvars[i];
  funcs += str[0];
  defs.push(str);
  if (isConst) consts[str[0]] = deFunc(str[0]);
  return true;
}