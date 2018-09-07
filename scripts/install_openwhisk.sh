#!/bin/bash
eval $(minishift oc-env) && eval $(minishift docker-env)
oc login $(minishift ip):8443 -u admin -p admin
oc new-project openwhisk-examples #create new project for openwhisk examples
oc project -q #should return openwhisk-examples...we are in the right project
oc process -f https://git.io/openwhisk-template | oc create -f - #deploy openwhisk on your local OpenShift
oc adm policy add-role-to-user admin developer -n openwhisk-examples  #you can use developer user to admin this project
