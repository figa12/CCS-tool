
{
	function extractLabelList(f, rest) {
		var restLabels;
		if (rest === undefined) return [f];
		restLabels = rest.map(function(syntax) {
			return syntax[3];
		});
		return [f].concat(restLabels)
	}

	function strFirstAndRest(first, rest) {
		return first + rest.join('');
	}
    
    function splitDelay(delay) {
        if (delay === 0)
            return [new tccs.Delay(0)];
        
        var delays = [];
        for (var i = 0; i < delay; i++) {
            delays.push(new tccs.Delay(1));
        }
        return delays;
    }

	// options is an arbitrary javascript object specified in the .parse(...) method
	var ccs = options.ccs;
	var tccs = options.tccs;
	var g = options.graph || new tccs.TCCSGraph();
}

start
	= Program

//A program consists of lines only used for process assignments.
Program
	= statements:Statements _ { return g; }
	/ _ { return g; }

Statements = Statement Statements
		   / Statement

Statement = Assignment
		  / SetDeclaration

SetDeclaration = _ "set" _ name:Identifier _ "=" _ "{" _ labels:LabelList _ "}" _ ";" { return g.defineNamedSet(name, new ccs.LabelSet(labels || [])); }

Assignment
	= (_ "agent" Whitespace)? _ name:Identifier _ "=" _ P:Process _ ";" { return g.newNamedProcess(name, P); }

//The rules here are defined in the reverse order of their precedence.
//Either a given rule applies, eg. +, and everything to the left must have higher precedence,
// or there is no plus, in which cases it must still have higher predence.
Process = Summation

Summation
	= P:Composition _ "+" _ Q:Summation { return Q instanceof ccs.SummationProcess ? g.newSummationProcess([P].concat(Q.subProcesses)) : g.newSummationProcess([P, Q]); }
	/ P:Composition { return P; }

Composition
	= P:Prefix _ "|" _ Q:Composition { return Q instanceof ccs.CompositionProcess ? g.newCompositionProcess([P].concat(Q.subProcesses)) : g.newCompositionProcess([P, Q]); }
	/ P:Prefix { return P; }

Prefix
	= action:Action _ "." _ P:Prefix { return g.newActionPrefixProcess(action, P); }
	/ delay:Delay _ "." _ P:Prefix { return g.newDelayPrefixProcesses(delay, P); }
	/ P:ReProcess { return P; }

ReProcess
	= P:ParenProcess _ "\\" _ "{" _ labels:LabelList? _ "}" { return g.newRestrictedProcess(P, new ccs.LabelSet(labels || [])); }
	/ P:ParenProcess _ "\\" _ setName:Identifier { return g.newRestrictedProcessOnSetName(P, setName); }
	/ P:ParenProcess _ "[" _ relabels:RelabellingList _ "]" { return g.newRelabelingProcess(P, new ccs.RelabellingSet(relabels || [])); }
	/ P:ParenProcess { return P; }

// Relabellings  [a/b, c/d]
RelabellingList
	= first:Relabel _ "," _ rest:RelabellingList { return [first].concat(rest); }
	/ relabel:Relabel { return [relabel]; }

Relabel
	= to:Label _ "/" _ from:Label { return {to: to, from: from}; }

ParenProcess
	= "(" _ P:Process _ ")" { return P; }
	/ P:ConstantProcess { return P; }

ConstantProcess
	= "0" { return g.getNullProcess(); }
	/ K:Identifier { return g.referToNamedProcess(K); }

Identifier "identifier"
	= first:[A-Z] rest:IdentifierRest { return strFirstAndRest(first, rest); }

IdentifierRest
	= rest:[A-Za-z0-9?!_'\-#^]*  { return rest; }

Action "action"
	= ['] label:Label { return new ccs.Action(label, true); }
	/ label:Label { return new ccs.Action(label, false); }

Delay "delay"
	= delay:Number { return splitDelay(parseInt(delay)); }

Label "label"
	= first:[a-z] rest:IdentifierRest { return strFirstAndRest(first, rest); }

LabelList
	= first:Label rest:(_ "," _ Label)* { return extractLabelList(first, rest); }

Number "number"
	= number:[0-9]+ { return parseInt(number.join(""), 10); }

Whitespace "whitespace"
	= [ \t]

Comment "comment"
	= "*" [^\r\n]* "\r"? "\n"?

//Useful utility
_ = (Whitespace / Newline)* Comment _
  / (Whitespace / Newline)*

Newline "newline"
	= "\r\n" / "\n" / "\r"
