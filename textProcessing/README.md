
# Text processing

## Application design
Here we want to build a very simple serverless application receiving text from 3 different feeds, processing it and writing results on a mysql database. A web action will create a human readable results web page.


```ascii
1
+------------------------------+
|                              |
|                              |
|   Txt feed (alarm 8 sec)     |
|                              +----------------------
|                              |                     |                            +-----------------------------+
+------------------------------+                     |                            |                             |                                                                                           +-------------------------------------+
                                                     |                      +---->+    Write Plain text received|                                                                                           |                                     |
                                                     |                      |     |                             +------------------------------------------------------------------------------+-----+------>     Generic Mysql Writer            |
                                                     |                      |     |                             |                                                                              |     |      |                                     |
2                                                    |                      |     +-----------------------------+                                                                              |     |      |                                     |
+------------------------------+                     |                      |                                                                                                                  |     |      +-------------+-----------------------+
|                              |         +-----------+----------------------+                                                                                                                  |     |                    |
|                              |         |                                  |                                                                                                                  |     |                    |
|   Txt feed (alarm 10 sec)    +-------->+                                  |     +-----------------------------+                                                                              |     |                    |
|                              |         |     Trigger                      |     |                             |                                                                              |     |                    |
|                              |         |                                  |---->+remove short words and write |                                                                              |     |                    |
+------------------------------+         |                                  |     |                             +------------------------------------------------------------------------------+     |                    |
                                         +------------+---------------------+     |                             |                                                                              |     |                    |
                                                      ^                     |     +-----------------------------+                                                                              |     |                    |
3                                                     |                     |                                                                                                                  |     |                    |
+------------------------------+                      |                     |                                                                                                                  |     |                    |
|                              |                      |                     |                                                                                                                  |     |                    |
|                              |                      |                     |     +-----------------------------+       +-----------------------------+         +------------------------------+     |                    |
|   Txt feed (alarm 20 sec)    |                      |                     |     |                             |       |                             |         |                              |     |                    |
|                              +----------------------+---------------------+     | count words                 |       | discard too long sentences  |         |  write text and word count   |     |                    |
|                              |                                            +---->+ and copy input to output    +------>+                             +--------->                              |     |                    |
+------------------------------+                                            |     |                             |       |                             |         |                              |     |                    |
                                                                            |     +-----------------------------+       +-----------------------------+         +------------------------------+     |                    |
                                                                            |                                                                                                                        |                    |
                                                                            |                                                                                                                        |                    |
                                                                            |    +-----------------------------+       +-----------------------------+                                               |                    |
                                                                            |    |                             |       |                             |                                               |                    |
                                                                            |    | count words                 +------>+ write word count            |                                               |                  |
                                                                            +--->+ and copy input to output    |       |                             +-----------------------------------------------+                    |
                                                                                 |                             |       |                             |                                                                   |
                                                                                 +-----------------------------+       +-----------------------------+                                                                   |
                                                                                                                                                                                                                         |
                                                                                                                                                                                                                         |
                                                                                                                                                                                                                         |
                                                                                                                                                                                                                         |
                                                                                                                                                                                                                         |
                                                                                                                                                                                                             +-----------v---------------------+
                                                                                                                                                                                                             |                                 |
                                                                                                                                                                                                             |                                 |
                                                                                                                                                                                                             |                                 |
                                                                                                                                                                                                             |                                 |
                                                                                                                                                                                                             |                                 |
                                                         XXXXXXXX                                                                     +---------------------------------+                                    |                                 |
                                                        XX      XX                                                                    |                                 |                                    |                                 |
                                                        XX      XX                                                                    |                                 |                                    |                                 |
                                                        XXX     XX                                                                    |     Web action                  +----------------------------------->+                                 |
                                                        XXXXXXXXXX                                                                    |     Proovide human readable     |                                    |                                 |
                                                            X        ---------------------------------------------------------------->+     output                      |                                    |      MySQL                      |
                                                            X                                                                         +---------------------------------+                                    |                                 |
                                                            X                                                                                                                                                |                                 |
                                                   XXXXXXXXXXXXXXXXXXXX                                                                                                                                      |                                 |
                                                            XX                                                                                                                                               |                                 |
                                                            X                                                                                                                                                |                                 |
                                                            X                                                                                                                                                |                                 |
                                                            X                                                                                                                                                |                                 |
                                                            X                                                                                                                                                |                                 |
                                                            X                                                                                                                                                +---------------------------------+
                                                           XXX
                                                          XX XX
                                                         XX   XX
                                                        XX     XX
                                                       XX       XX
                                                      XX         XX

```

## prerequisite

* Openwhisk installed and working on minishift. See [parent doc](../README.md)
* Mysql installed and working on local openshift/minishift. Using the console should be straight forward, [here](https://docs.openshift.com/enterprise/3.0/using_images/db_images/mysql.html) you can find official docs though.

## Implementation
Do you want to contribute on this? Refer to main [CONTRIBUTE](../CONTRIBUTE.md) document
