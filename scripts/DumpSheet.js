on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!DumpSheet") == 0)
    {
        var chatMessage = "";

        var params = {}
        function parseArgs(args){
            for(lcv = 1; lcv < args.length; lcv++)
            {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }
        
        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);
   
        var output = findObjs({type: 'attribute', characterid: params.characterID});
        log(output);

    }
});