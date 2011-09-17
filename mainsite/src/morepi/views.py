"""
MorePi - Mock RESTful API
Copyright (c) 2011 Jason Stehle

Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the 
"Software"), to deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to 
the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

import re, string, urlparse
from json import json_parse, render_to_json
from django.utils.encoding import force_unicode
                                 
mock_dict = {}


def status_message(success, message):
    return {'success':success,'message':message}


class SimpleObject(object):
    """A simple object with dynamic properties"""
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def get_request_properties(request, raw_path):
    """Get the mock_dict_key for the item collection, and the item key from the URL where available."""
    if raw_path == "":
        return SimpleObject(key = '', collection = '', item_id = '')
    
    if not raw_path.endswith('/'): raw_path += '/'
    
    if raw_path.count('/') % 2 == 0: #It's an item: collection/id/
        parts = raw_path.split('/')
        collection_name = parts[len(parts) - 3]
        item_parts = raw_path.rsplit('/', 2)
        return SimpleObject(key = item_parts[0] + '/', collection = collection_name, item_id = item_parts[1])
    else: #It's a collection
        parts = raw_path.split('/')
        collection_name = parts[len(parts) - 2]
        return SimpleObject(key = raw_path, collection = collection_name, item_id = None)


def get_collection(rp):
    """Get the item collection based on the provided request properties."""
    if rp.key not in mock_dict:
        mock_dict[rp.key] = {"next_id": 0, "items": {}}
    return mock_dict[rp.key]


def get_item(ki):
    """Get the item from the item collection based on the provided request properties."""
    collection = get_collection(ki)
    if ki.item_id not in collection["items"]:
        return None
    else:
        return collection["items"][ki.item_id]


def list_filter(item, key, value):
    """Filter the list of items by the given key and value. Absence of the key is a miss."""
    return item[key] == value if key in item else False


def mock_get(request, raw_path):
    """Get an item or collection."""
    rp = get_request_properties(request, raw_path)
        
    if rp.item_id != None: #It's an item, look it up and return it if you can.
        item = get_item(rp)
        if item != None:
            return item
        else:
            return status_message(False, "Item {} does not exist in {}.".format(rp.item_id, rp.key))
    else: #It's a collection, return the items for this key.
        collection_holder = {}
        filtered_items = get_collection(rp)["items"].values()
        
        #Apply any filters to the list.
        for filter_key in request.GET.keys():
            if filter_key != '_': #Ignore jQuery cache argument
                filter_value = request.GET[filter_key]
                filtered_items = [item for item in filtered_items if list_filter(item, filter_key, filter_value)]
        
        collection_holder[rp.collection] = filtered_items
        
        return collection_holder


def mock_post(request, raw_path):
    """Either update an individual item or create a new item."""
    rp = get_request_properties(request, raw_path)
    collection = get_collection(rp)
    
    if rp.item_id != None: #It's an item, overlay passed values.
        if rp.item_id in collection["items"]:
            collection["items"][rp.item_id].update(json_parse(request.raw_post_data))
        else:
            collection["items"][rp.item_id] = json_parse(request.raw_post_data)
        return status_message(True, "Item {} saved to {}.".format(rp.item_id, rp.key))
    
    else: #It's a collection, create item
        next_id = str(collection["next_id"]) 
        collection["next_id"] += 1
        item_json = request.raw_post_data.replace('___id___', next_id) #Replace the embedded id placeholder with the actual ID.
        collection["items"][next_id] = json_parse(item_json)
        return status_message(True, next_id)


def mock_put(request, raw_path):
    """Replace or create an individual item at a specific key."""
    rp = get_request_properties(request, raw_path)
    collection = get_collection(rp)
    
    if rp.item_id != None: #It's an item, overwrite it
        collection["items"][rp.item_id] = json_parse(request.raw_post_data)
        collection["next_id"] += 1
        
        return status_message(True, "Item {} saved to {}.".format(rp.item_id, rp.key))
        
    return status_message(False, "Operation undefined.")


def mock_delete(request, raw_path):
    """Delete an item or collection."""
    rp = get_request_properties(request, raw_path)
    collection = get_collection(rp)
    
    if rp.item_id != None: #It's an item, delete existing item
        if rp.item_id in collection["items"]:
            del collection["items"][rp.item_id]
        return status_message(True, "Item {} deleted from {}.".format(rp.item_id, rp.key))
    
    else: #It's a collection, delete the collection
        if rp.key in mock_dict:
            del mock_dict[rp.key]     
        return status_message(True, "Deleted collection.")


def mock_request_processor(request, raw_path):
    """Handle a normal API call."""
    
    if raw_path == "" or raw_path == None:
        return mock_request_root(request, raw_path)
    
    if request.method == 'GET':
        return mock_get(request, raw_path)
    elif request.method == 'POST':
        return mock_post(request, raw_path)
    elif request.method == 'PUT':
        return mock_put(request, raw_path)
    elif request.method == 'DELETE':
        return mock_delete(request, raw_path)
    else:
        return status_message(False, "Baffled by request method {}!".format(request.method))


def batch_substitute(raw_path, responses):
    """Replace placeholder tokens with values from previous batch responses."""
    i= 0
    searchPattern = "\{\{\{([^\}]+)"
    subPattern = "\{\{\{([^\}]+)\}\}\}"
    
    while True:
        res = re.search(searchPattern, raw_path)
        if res != None:
            extraction = res.group(1)
            parts = extraction.split(".")
            #reference = parts[0] #should always be "responses" for now.
            position = int(parts[1])
            key = parts[2]
            value = responses[position][key]
            raw_path = re.sub(subPattern, str(value), raw_path, 1)
        else:
            break
        
        i += 1
        if i > 20:
            print "Too many batch substitution loops."
            break
    return raw_path


def mock_request_batch(request, raw_path):
    """Handle a request batch."""
    base_api_url = string.replace(request.path, raw_path, "")
    batch_items = json_parse(request.raw_post_data)
    responses = []
    for item in batch_items["batch"]:
        batch_request = SimpleObject() #Mock a request object for each batch item.
        batch_request.method = item["type"]
        if "data" in item:
            batch_request.raw_post_data = batch_substitute(item["data"], responses)
        else:
            batch_request.raw_post_data = ""
            
        base_url = batch_substitute(item["url"], responses)
        print "Batch item: " + item["type"] + " " + base_url + " (" + item["url"] + ")"
        
        batch_request.user = request.user
        batch_request.path_info = force_unicode(base_url)
        batch_item_path = string.replace(base_url, base_api_url, "")
        
        batch_request.GET = {}
        
        query_delim_loc = batch_item_path.find('?')
        if query_delim_loc > -1:
            query_start = query_delim_loc + 1
            query_split = urlparse.parse_qs(batch_item_path[query_start:])
            batch_item_path = batch_item_path[:query_delim_loc]
            
            for k in query_split.keys():
                batch_request.GET[k] = ','.join(query_split[k])
            
        
        responses.append(mock_request_processor(batch_request, batch_item_path))
    return {"responses":responses, "success":True}


def purge_everything():
    """Clear the mock dictionary and any collection properties."""
    global mock_dict
    mock_dict = {}


def mock_request_root(request, raw_path):
    """Handle an API call to the root."""
    if request.method == 'GET': #Return the entire database
        return mock_dict
    elif request.method == 'DELETE': #Wipe everything
        purge_everything()
        return status_message(True, "Deleted all collections and properties.")
    else:
        return status_message(False, "Baffled by {}!".format(request.method))


def mock_request_entry_point(request, raw_path):
    """Entry point for all API requests."""
    try:
        if raw_path == "batch/":
            return render_to_json(mock_request_batch(request, raw_path))
        else:
            return render_to_json(mock_request_processor(request, raw_path))
    except Exception as exc:
        return render_to_json(status_message(False, exc.message))

