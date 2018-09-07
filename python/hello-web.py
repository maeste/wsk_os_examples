def main(args):
    name = args.get("name", "stranger")
    greeting = "Hello " + name + "!"
    print(greeting)
    return {"body": "<html><body><h3>" + greeting + "</h3></body></html>"}
