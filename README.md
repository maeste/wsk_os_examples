# Openwhisk introduction by examples (on minishift)

## What is Apache OpenWhisk?
> Apache OpenWhisk (Incubating) is an open source, distributed Serverless platform that executes functions (fx) in response to events at any scale. OpenWhisk manages the infrastructure, servers and scaling using Docker containers so you can focus on building amazing and efficient applications.
>
> The OpenWhisk platform supports a programming model in which developers write functional logic (called Actions), in any supported programming language, that can be dynamically scheduled and run in response to associated events (via Triggers) from external sources (Feeds) or from HTTP requests. The project includes a REST API-based Command Line Interface (CLI) along with other tooling to support packaging, catalog services and many popular container deployment options.

http://openwhisk.apache.org


## What is minishift?

>Minishift is a tool that helps you run OpenShift locally by running a single-node OpenShift cluster inside a VM. You can try out OpenShift or develop with it, day-to-day, on your local host.

>Minishift uses libmachine for provisioning VMs, and OpenShift Origin for running the cluster. The code base is forked from the Minikube project.

https://github.com/minishift/minishift

## Setup openwhisk on minishift
Details on minishift and installation procedures can be found [here](https://docs.openshift.org/latest/minishift/getting-started/index.html).

### Configure your environment

#### minishift4openwhisk command

Create a file in your minishift installation directory called ```minishift4openwhisk``` and give it +x right (you can find in [scripts directory](./scripts))
```bash
#!/bin/bash

#Don't foget to add the location of minishift executable to PATH

minishift profile set openwhisk-examples
minishift config set memory 6GB
minishift config set cpus 2
minishift config set image-caching true
minishift addon enable admin-user
minishift addon enable anyuid

minishift start

minishift ssh -- sudo ip link set docker0 promisc on
```

Start minishift using the just created command. It will create and config your instance.
It's safe to use this command to start minishift every time you would use it for OpenWhisk, even if config commands will have effects only first time.

#### Setup your environment for OpenShift

In current shell run

```bash
eval $(minishift oc-env) && eval $(minishift docker-env)
oc login $(minishift ip):8443 -u admin -p admin
```

#### Install OpenWhisk on your local openshift cluster

Thanks to [this project](https://github.com/projectodd/openwhisk-openshift) it's easy to install openwhisk on openshift (you can write it in your console, but you can find a script called ```install_openwhisk in``` [scripts directory](./scripts) You will use it only the first time, no need to put in your PATH)

```bash
eval $(minishift oc-env) && eval $(minishift docker-env)
oc login $(minishift ip):8443 -u admin -p admin
oc new-project openwhisk-examples #create new project for openwhisk examples
oc project -q #should return openwhisk-examples...we are in the right project
oc process -f https://git.io/openwhisk-template | oc create -f - #deploy openwhisk on your local OpenShift
oc adm policy add-role-to-user admin developer -n faas  #you can use developer user to admin this project
```

Openwhisk will take several minutes tostart on minishift (more than 10 on my machine). You could open ```minishift console``` and navigate to you project ```openwhisk-example``` and wait for all pod started.

### Install and configure openwhisk CLI

Download it from https://github.com/apache/incubator-openwhisk-cli/releases/ and unzip it in a directory in your PATH (I use minishift one). Then create in your PATH and give +x right this ```wsk_setup``` (you can find in [scripts directory](./scripts))

```bash
#!/bin/bash
eval $(minishift oc-env) && eval $(minishift docker-env)
oc login $(minishift ip):8443 -u admin -p admin
oc project openwhisk-examples #be sure to be in the right project
AUTH_SECRET=$(oc get secret whisk.auth -o yaml | grep "system:" | awk '{print $2}' | base64 --decode)
wsk property set --auth $AUTH_SECRET --apihost $(oc get route/openwhisk --template="{{.spec.host}}")
```

Openwhisk use a self signed certificate, to avoid error you should always use ```wsk -i```. To avoid this annoying
```bash
alias wsk='wsk -i $@'
```

### Test installation

Ok you are ready to test your installation

```
wsk action list
```

You shoud get an answer like this:
```bash
actions
/whisk.system/combinators/forwarder                                    private nodejs:6
/whisk.system/combinators/eca                                          private nodejs:6
/whisk.system/combinators/retry                                        private nodejs:6
/whisk.system/watson-translator/translator                             private nodejs:6
/whisk.system/utils/smash                                              private nodejs:6
/whisk.system/combinators/trycatch                                     private nodejs:6
/whisk.system/utils/sort                                               private nodejs:6
/whisk.system/utils/split                                              private nodejs:6
/whisk.system/samples/curl                                             private nodejs:6
/whisk.system/utils/namespace                                          private nodejs:6
/whisk.system/utils/head                                               private nodejs:6
/whisk.system/samples/helloWorld                                       private nodejs:6
/whisk.system/utils/date                                               private nodejs:6
/whisk.system/github/webhook                                           private nodejs:6
/whisk.system/utils/hosturl                                            private nodejs:6
/whisk.system/utils/echo                                               private nodejs:6
/whisk.system/samples/wordCount                                        private nodejs:6
/whisk.system/samples/greeting                                         private nodejs:6
/whisk.system/watson-speechToText/speechToText                         private nodejs:6
/whisk.system/watson-textToSpeech/textToSpeech                         private nodejs:6
/whisk.system/watson-translator/languageId                             private nodejs:6
/whisk.system/slack/post                                               private nodejs:6
/whisk.system/utils/cat                                                private nodejs:6
/whisk.system/weather/forecast                                         private nodejs:6
/whisk.system/websocket/send                                           private nodejs:6
/whisk.system/alarmsWeb/alarmWebAction                                 private nodejs:6
/whisk.system/alarms/interval                                          private nodejs:6
/whisk.system/alarms/once                                              private nodejs:6
/whisk.system/alarms/alarm                                             private nodejs:6
/whisk.system/invokerHealthTestAction0                                 private

```

If you get an error like this:

```bash
error: Unable to obtain the list of actions for namespace 'default': The connection failed, or timed out. (HTTP status code 503)
Run 'wsk --help' for usage.
```

Probably your openwhisk pod has not yet started. Open openshift console and check again

If you get an empty or shorter list of actions (just 5 elements most probably), you need to reinstall default catalog. Follow [this instruction](https://github.com/projectodd/openwhisk-openshift#common-problems) from openwhisk-openshift project (In a nutshell you need to download ```template.yaml``` from that project and run ```oc delete job install-catalog; oc process -f template.yml | oc create -f -```)

If everything went weel you are good having openwhisk installed on your local openshift cluster. It's time to play with it...

## Openwhisk key concepts by examples

In this chapter I will introduce openwhisk key concepts provinding examples for each of them. It's far to be a formal documentation or explanation, if you want this refer to [official documentation](https://openwhisk.apache.org/documentation.html)
Openwhisk is a polyglot platform, so you can use various langunaget to write your code (actions). For this reason you will find examples in different languages. Again for a list of all supported languages refer to [official documentation](https://openwhisk.apache.org/documentation.html)

All this examples are published on this github project. Steps described in next chapeters prerequisite is to clone this project (or a fork of this) locally
```bash
git clone
```
We will refer to this cloned directory as $PRJ_HOME in our next examples

### Openwhisk Actions

#### Say Hello using Python
##### Create the action
* It’s the basic unit of work
* It’s stateless (idemponent)
* It could be written in various language (Python, nodejs, Java..)
* Cold invoked synch or asynch.

Our first action (using Python) could be found in
```bash
PRJ_HOME/python/Hello.py
```

```Python
def main(args):
    name = args.get("name", "stranger")
    text = "Hello " + name + "!"
    print(text)
    return {"text": text}
```

It's a classical ```HelloWorld``` code snippet. Let's deploy it on our openwhisk instance.
```bash
cd $PRJ_HOME/python
wsk action create helloPython hello.py
```
Basically you should just provide a name, ```helloPython``` in this case, and a source code file ```hello.py```. If you change anything in your source code you could redeploy it with:
```bash
cd $PRJ_HOME/python
wsk action update helloPy hello.py
```
Opewhisk will keep only the latest version of your action with the same name.

Now the ```wsk action list``` would contain your own action
```bash
[...]
/whisk.system/helloPy            private python:2
[...]
```
##### Invoke the action
Invoking an action with ```wsk``` CLI is pretty simple. (see Web action chapter for REST invocation). CLI build a JSON request and send it to openwhisk. FOr each invocation a container is started and execution of your function run inside this container. Any state is local to the container and it's the reason because actions should be idemponent. There is no guarantee actions execution is ordered or atomically (2 actions could run concurrently). For a more complete discussion on what happen under the wood on action call see [here](https://github.com/apache/incubator-openwhisk/blob/master/docs/actions.md#action-execution)
An action could be invoked in a synch (blocking) way, waiting for results or in asynch (non-blocking) fire-and-forget way.
Invoking an action create an activation and return an activation-id in case of non-blocking invocation, or result JSON in case of blocking invocation.
Let's invoke (blocking) our ```helloPy``` action
```bash
wsk action invoke helloPy --result --param name MyName
```
should return:
```json
{
    "text": "Hello MyName!"
}
```
Invoking the same action in non-blocking way (removing ```--results``` option)
```bash
wsk action invoke helloPy --param name AnotherNameOfMyself
```
should return
```bash
ok: invoked helloPy with id 7b806981cc084214806981cc089214e4
```
This is the activation id. You could use it to see results invoking
```bash
wsk activation result 7b806981cc084214806981cc089214e4
```
which will return results:
```json
{
    "text": "Hello AnotherNameOfMyself!"
}
```
You can also see logs (standard output and standard error) running
```bash
wsk activation logs 7b806981cc084214806981cc089214e4
```
which returns
```bash
2018-09-06T07:03:12.830411000Z stdout: Hello MyName!
```
As explained above (and in more details in linked documentation) an activation will be created for any action invocation, both blocking and non blocking. You can get all activations list running
```bash
wsk activation list
```
Which returns something like
```bash
activations
7b806981cc084214806981cc089214e4 helloPy
7ae03b21eb3f4728a03b21eb3f072890 helloPy
071ba0ab24c844429ba0ab24c8e4427d invokerHealthTestAction0
ada9097868a84007a9097868a8f00781 invokerHealthTestAction0
60173ca043ce44ee973ca043ce04ee17 invokerHealthTestAction0
6c8969e17c0a42178969e17c0ac217a1 invokerHealthTestAction0
[...]
```
As you can see there is 2 different activations for helloPy because we invoked it 2 times. The ```7ae03b21eb3f4728a03b21eb3f072890``` ID is for our first blocking invocation. You can use it or any other id to see logs, or results again or full information with
```bash
wsk activation get 7ae03b21eb3f4728a03b21eb3f072890
```
which returns
```JSON
ok: got activation 7b806981cc084214806981cc089214e4
{
    "namespace": "whisk.system",
    "name": "helloPy",
    "version": "0.0.1",
    "subject": "whisk.system",
    "activationId": "7b806981cc084214806981cc089214e4",
    "start": 1536217392819,
    "end": 1536217392831,
    "duration": 12,
    "response": {
        "status": "success",
        "statusCode": 0,
        "success": true,
        "result": {
            "text": "Hello MyName!"
        }
    },
    "logs": [
        "2018-09-06T07:03:12.830411000Z stdout: Hello MyName!"
    ],
    "annotations": [
        {
            "key": "path",
            "value": "whisk.system/helloPy"
        },
        {
            "key": "waitTime",
            "value": 1472
        },
        {
            "key": "kind",
            "value": "python:2"
        },
        {
            "key": "limits",
            "value": {
                "logs": 10,
                "memory": 256,
                "timeout": 60000
            }
        },
        {
            "key": "initTime",
            "value": 7
        }
    ],
    "publish": false
}
```

#### Reverse string using javascript
As said above Openwhisk is a polyglot framework. Lets write an action using javascript. We will use it togheter with helloPy in next chapter, creating a sequence.

Our first javascript action  could be found in
```bash
PRJ_HOME/js/reverse/reverse.js
```

```js
function main(params) {
    var s = params.text
    reversed = s.split("").reverse().join("");
    return { text: reversed };
}
```

Let's deploy it on our openwhisk instance and invoke it. (note I'm using ```update``` command here instead of ```create```; You can always use this one, it will take care to create action if not exist or to update it if it already exist)
```bash
cd $PRJ_HOME/js/reverse/
wsk action update reverseText reverse.js
wsk action invoke reverseText --result --param text ThiIsATest
```
which will return as expected
```bash
{
    "text": "tseTAsIihT"
}
```
#### Using external library (js)
Are you thinking actions are too limited and uploading just snippet of code seems usefull only for "HelloWorld" code? Not at all, you can write actions using various classes packaged in a more complex application and even use external library. In this example we will se how to package a (simple) javascript action with dependency on an external library using node.
It's out of the scope of this tutorial to explain how to install node on your environment. Please refer to [official site](https://nodejs.org/en/) if you need it.

You find the example in ```$PRJ_HOME/js/padding``` containing ```package.json``` defining node dependencies and main file:
```JSON

  "name": "padding",
  "main": "action.js",
  "dependencies": {
    "left-pad": "1.1.3"
  }
}
```
Openwhisk will look for main function in  ```action.js``` (note also ```exports.main``` line, exporting any method as main)
```js
function paddingAction(args) {
    const leftPad = require("left-pad")
    var text = args.text ;
    return { text: leftPad(text, 30, "#") }
}

exports.main = paddingAction;
```
To deploy in in openwhisk w/ it's dependency library ```left-pad``` follow this 3 Steps
1 - Install node dependencies locally
```bash
cd PRJ_HOME/js/paddding
npm install
```
2 - create a zip containing your code, json files and created ```node_modules``` directory
```bash
cd PRJ_HOME/js/paddding
zip -r padding.zip *
```
3- deploy zip as nodejs action in OpenWhisk
```bash
cd PRJ_HOME/js/paddding
wsk action create paddingJs --kind nodejs:8 padding.zip
```
Invoke it as usual with
```
wsk action invoke paddingJs --result --param text myText
```
and get expected result
```js
{
    "text": "########################myText"
}
```
##### web actions
Every action could be invoked with a REST call. For example we can enable ```HelloPy``` action to be invoked via https
```
wsk action update helloPy --web true
```
And we can get its url Using
```
wsk action get helloPy --url
```
which will return an url. If you open it with a brownser (or even with curl) you will see on ```wsk activation poll``` console the action called, but you will not see anything appear in browser windows because the output is not html or xml.
Lets create anothe action in Python (```hello-web.py```) giving some results in browser windows
```Python
def main(args):
    name = args.get("name", "stranger")
    greeting = "Hello " + name + "!"
    print(greeting)
    return {"body": "<html><body><h3>" + greeting + "</h3></body></html>"}
```
then create the action and get its url
```bash
cd $PRJ_HOME/python
wsk action create helloWeb --web true hello-web.py
wsk action get helloPy --url
```
Opening the url in browser you get this (note I've added also input parameter here ```?name=NotAStranger```)
<kbd>![](img/screenshot.png)</kdb>

##### Other language Actions
You can write actions in many other languages. Please refer to [official documentation](https://github.com/apache/incubator-openwhisk/blob/master/docs/actions.md#languages-and-runtimes) for more information. Maybe I'll expand this tutorial w/ examples in other language in next future. For the moment I think above examples are sufficient to introduce actions concepts and usefull to introduce other openwhisk concepts in next chapters

### Openwhisk Action sequences
Multiple actions could be chained using sequences
* Output of an action is the input of next one
* To create a sequence the composing actions must exist
* Action names are used as keys for the sequence creation
* A sequence could be polyglot, composing actions written in different languages

#### Put our 3 actions together
In practice we can create a new action called ```actionSequence``` chaining our 3 actions
```bash
wsk action update actionSequence --sequence helloPy,reverseText,paddingJs
```
And then invoke it
```
wsk action invoke actionSequence --result --param text ThisIsMyName
```
Getting the expected result
```json
{
    "text": "###########!emaNyMsIsihT olleH"
}
```
#### Action order in sequence matters
If you update your sequnece chainging the ordered
```bash
wsk action update actionSequence --sequence helloPy,paddingJs,reverseText
```
And then invoke it
```
wsk action invoke actionSequence --result --param text ThisIsMyName
```
You will get a different result
```json
{
    "text": "!emaNyMsIsihT olleH###########"
}
```
#### Input and output names of actions matters
As said at beginning of this chapter the ouput of an action is used as input of next one. Could you guess what would happen if you invoke a sequence like this
```bash
wsk action update wrongSequence --sequence paddingJs,reverseText,helloPy
```
First of all you should invoke it passing the right input parameter ```text``` because it's the input parameter needed by first action in sequence
```bash
wsk acttion invoke wrongSequence --result --param text ThisIsAText
```
But the output could be a little surprising
```json
{
    "text": "Hello stranger!"
}
```
This is because the last action expect an input parameter called ```name``` and not one called ```text``` which is the output of previous 2 actions. IOW helloPy not finding the parameter ```name``` just use default defined in code ```stranger``` while ```text``` is just ignored and lost in final output

#### Looking activations log for sequences
When a sequence is invoked an activation is created for the sequence itself, but also an activation for each action composing it. Maybe using ```poll``` option for activations list would help understanding what happen under the wood. In a different console type
```bash
wsk activation poll
```
When our above sequence is invoked you should see a log update similar to this one
```json
Enter Ctrl-c to exit.
Polling for activation logs
Activation: 'helloPy' (c583009ac4694f3683009ac4697f36d0)
[
    "2018-09-06T12:24:28.433883000Z stdout: Hello ThisIsMyName!"
]

Activation: 'paddingJs' (1923f40a92fb400aa3f40a92fb000a53)
[]

Activation: 'reverseText' (f7f535658a2347e6b535658a2367e65a)
[]

Activation: 'actionSequence' (f4f81cf9ff704776b81cf9ff70a7760e)
[
    "c583009ac4694f3683009ac4697f36d0",
    "f7f535658a2347e6b535658a2367e65a",
    "1923f40a92fb400aa3f40a92fb000a53"
]
```


### Triggers and rules
* Triggers are channels for events
* Rules are used to link a trigger to one or more actions
* For example trigger from IoT camera streaming could be linked via rules to different action, like saveSample, detectFace etc etc
* Trigger will take care of input parameter forwarding to different actions

Lets create our first Trigger
```bash
wsk trigger create helloTrigger
```
Verify it is correctly created
```bash
wsk trigger list
```
should returns
```bash
triggers
/whisk.system/helloTrigger                                             private
```
Now open in another console ```wsk activation poll``` ro monitor what's happenning and fire trigger event specifying also parameters
```bash
wsk trigger fire helloTrigger --param name MyName
```
It will returns
```bash
ok: triggered /_/helloTrigger with id
```
I hasn't an ```id``` specified and on ```wsk activation poll``` console nothing happens. This is because you need to associate one or more actions to the trigger event and this is done by ```rules```
Lets create our first rule
```bash
wsk rule create helloRule helloTrigger helloPython
```
Firing trigger event again
```bash
wsk trigger fire helloTrigger --param name MyName
```
You will get an answer like this
```bash
ok: triggered /_/helloTrigger with id 990db9c5f770412c8db9c5f770612cb9
```
And ```wsk activation poll``` console will sho something like this
```json
Polling for activation logs
Activation: 'helloTrigger' (990db9c5f770412c8db9c5f770612cb9)
[
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"2242b7edfc25462d82b7edfc25c62d08\",\"rule\":\"whisk.system/helloRule\",\"action\":\"whisk.system/helloPy\"}"
]

Activation: 'helloPy' (2242b7edfc25462d82b7edfc25c62d08)
[
    "2018-09-06T17:55:12.310251000Z stdout: Hello MyName!"
]
```
Note trigger fire is always non-blocking and to get result you should invoke ```wsk activations result 990db9c5f770412c8db9c5f770612cb9``` both on trigger's or action's activation id. The one on trigger will return the input generated for actions, while the one on actions will return the effective result of each actions.

Of course, you could also associate a sequence to your triggers
```bash
wsk rule create helloRule2 helloTrigger actionSequence
```
Now we have one trigger with 2 defined rules, which activate an action and a sequence of actions. When you fire it you will see something more complex in your ```wsk activation poll ``` console
```json
Enter Ctrl-c to exit.
Polling for activation logs

Activation: 'helloPy' (16cd65b132bd4b5b8d65b132bd9b5b3a)
[
    "2018-09-06T17:59:54.366068000Z stdout: Hello MyName!"
]

Activation: 'helloTrigger' (f590e557dff647a090e557dff627a047)
[
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"16cd65b132bd4b5b8d65b132bd9b5b3a\",\"rule\":\"whisk.system/helloRule\",\"action\":\"whisk.system/helloPy\"}",
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"a788dbe5f4dd4dd988dbe5f4dd8dd962\",\"rule\":\"whisk.system/helloRule2\",\"action\":\"whisk.system/actionSequence\"}"
]

Activation: 'reverseText' (5c87e70502184e5e87e7050218ee5e25)
[]

Activation: 'paddingJs' (62880a941a5c4ec5880a941a5caec56a)
[]

Activation: 'helloPy' (656414c8df004607a414c8df00c607d0)
[
    "2018-09-06T17:59:55.210774000Z stdout: Hello MyName!"
]

Activation: 'actionSequence' (a788dbe5f4dd4dd988dbe5f4dd8dd962)
[
    "656414c8df004607a414c8df00c607d0",
    "62880a941a5c4ec5880a941a5caec56a",
    "5c87e70502184e5e87e7050218ee5e25"
]
```

### Feeds
Feeds are essentialy an external source of event firing triggers.  Feeds could have any external event provider to fire events; some non exaustive examples list could be: Infinispan, JMS, AMQP, MQTT, RSS. As a basic example we will use the default Alarm feed to fire our trigger every 8 seconds.
We will use ```/whisk.system/alarms/alarm``` feed action which get as first parameter ```cron```, a crontab specification of when to fire the trigger. The sencond parameter ```payload``` is parameters passed to trigger (and so to rules/actions) in JSON format.

We need to create a trigger with feed action defined
```bash
wsk trigger create everyEightSeconds --feed /whisk.system/alarms/alarm -p cron "*/8 * * * * *" -p trigger_payload "{\"name\":\"ThisIsMyName\"}"
```
This will fire trigger every 8 seconds, passing always the same payload.
As we learned above to make trigger doing something for real we need to add a rule
```bash
wsk rule create helloRuleCron everyEightSeconds helloPy
```
And in our ```wsk activation poll``` console we will have an output like this
```bash
[...]
Activation: 'helloPy' (7c1cc85c69d84c4e9cc85c69d84c4ed3)
[
    "2018-09-07T06:18:16.838187000Z stdout: Hello ThisIsMyName!"
]

Activation: 'everyEightSeconds' (5b3c8ecd0012428fbc8ecd0012a28f20)
[
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"7c1cc85c69d84c4e9cc85c69d84c4ed3\",\"rule\":\"whisk.system/helloRuleCron\",\"action\":\"whisk.system/helloPy\"}"
]

Activation: 'helloPy' (d88fe89376fd45ba8fe89376fd65ba2a)
[
    "2018-09-07T06:18:24.834763000Z stdout: Hello ThisIsMyName!"
]

Activation: 'everyEightSeconds' (bb5f4afd84d545e59f4afd84d575e5a5)
[
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"d88fe89376fd45ba8fe89376fd65ba2a\",\"rule\":\"whisk.system/helloRuleCron\",\"action\":\"whisk.system/helloPy\"}"
]

Activation: 'helloPy' (7d95ac69ef584ff795ac69ef58eff788)
[
    "2018-09-07T06:18:32.834971000Z stdout: Hello ThisIsMyName!"
]

Activation: 'everyEightSeconds' (9a72f907b4b44e26b2f907b4b4ce261b)
[
    "{\"statusCode\":0,\"success\":true,\"activationId\":\"7d95ac69ef584ff795ac69ef58eff788\",\"rule\":\"whisk.system/helloRuleCron\",\"action\":\"whisk.system/helloPy\"}"
]
[...]
```
You have to remove at least rule to stop it. Better to remove trigger too
```bash
wsk rule delete helloRuleCron
wsk trigger delete everyEightSeconds
```

### Package
Package permit to group functionality. Actions in package share environment and default parameters.
Let see how to create a package and use it with default parameters
```
wsk package create myPackage
```
Then put 2 actions in this package
```
cd $PRJ_HOME/js/reverse
wsk action create myPackage/reverse reverse.js
cd $PRJ_HOME/js/padding
wsk action create myPackage/padding --kind nodejs:8 padding.zip
```
Define default variable for the package
```
wsk package update myPackage --param text "myPackage default text"
```
Both actions will use this as default parameter if none are passed
```
wsk action invoke --result myPackage/reverse
```
Will produce this Output
```
{
    "text": "txet tluafed egakcaPym"
}
```
The same will happen with
```
wsk action invoke --result myPackage/paddingJs
```
Producing
```
{
    "text": "########myPackage default text"
}

```
You can overwrite default parameters passing explicitly in action invocation
```
wsk action invoke --result myPackage/reverse --param text nonDefaultText
```
willproduce
```
{
    "text": "txeTtluafeDnon"
}
```

## Advanced examples
The aims of this project is to provide some good examples putting everything together and integrating with other cloud resources (Databases, differen trigger feeds, cache etc etc).
This is a work in progress. See [HOW TO CONTRIBUTE](./CONTRIBUTE.md)

* [Connecting to MySQL](./mysql/README.md)
* [Simple text processing writing on MySQL DB and web action to read results](./textProcessing/README.md)
