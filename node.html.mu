<!doctype html>
<html>

<head>
<title>{{name}}</title>
</head>

<body>

<h1>{{name}}</h1>

<h2>Dependency of</h2>
<ul>
{{#dependency_of}}
<li><a href="{{dependent}}">{{dependent}}</a></li>
{{/dependency_of}}
</ul>

<h2>Depends on</h2>
<ul>
{{#depends_on}}
<li><a href="{{dependency}}">{{dependency}}</a></li>
{{/depends_on}}
</ul>

</body>

</html>
