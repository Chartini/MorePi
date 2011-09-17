import simplejson 
from django.http import HttpResponse

def json_parse(content):
    return simplejson.loads(content)

def json_stringify(obj,*args,**kwargs):
    return simplejson.dumps(obj,*args,**kwargs)

def render_to_json(obj):
    return HttpResponse(json_stringify(obj), mimetype="application/json")
