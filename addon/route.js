import Ember from 'ember';
const { Logger: { assert, info }, isNone, isEmpty, run, get, getOwner } = Ember;
const EmberError = Ember.Error;

function parentRoute(route) {
  var handlerInfo = handlerInfoFor(route, route.router.router.state.handlerInfos, -1);
  return handlerInfo && handlerInfo.handler;
}

function handlerInfoFor(route, handlerInfos, _offset) {
  if (!handlerInfos) { return; }

  var offset = _offset || 0;
  var current;
  for (var i = 0, l = handlerInfos.length; i < l; i++) {
    current = handlerInfos[i].handler;
    if (current === route) { return handlerInfos[i + offset]; }
  }
}

function buildRenderOptions(route, namePassed, isDefaultRender, name, options) {
  var controller = options && options.controller;
  var templateName;
  var viewName;
  var ViewClass;
  var template;
  var LOG_VIEW_LOOKUPS = get(route.router, 'namespace.LOG_VIEW_LOOKUPS');
  var into = options && options.into && options.into.replace(/\//g, '.');
  var outlet = (options && options.outlet) || 'main';
  let owner = getOwner(route);

  if (name) {
    name = name.replace(/\//g, '.');
    templateName = name;
  } else {
    name = route.routeName;
    templateName = route.templateName || name;
  }

  if (!controller) {
    if (namePassed) {
      controller = owner.lookup(`controller:${name}`) || route.controllerName || route.routeName;
    } else {
      controller = route.controllerName || owner.lookup(`controller:${name}`);
    }
  }

  if (typeof controller === 'string') {
    var controllerName = controller;
    controller = owner.lookup(`controller:${controllerName}`);
    if (!controller) {
      throw new EmberError(`You passed \`controller: '${controllerName}'\` into the \`render\` method, but no such controller could be found.`);
    }
  }

  if (options && Object.keys(options).indexOf('outlet') !== -1 && typeof options.outlet === 'undefined') {
    throw new EmberError('You passed undefined as the outlet name.');
  }

  if (options && options.model) {
    controller.set('model', options.model);
  }

  viewName = options && options.view || namePassed && name || route.viewName || name;
  ViewClass = owner._lookupFactory(`view:${viewName}`);
  template = owner.lookup(`template:${templateName}`);

  var parent;
  if (into && (parent = parentRoute(route)) && into === parentRoute(route).routeName) {
    into = undefined;
  }

  var renderOptions = {
    owner,
    into,
    outlet,
    name,
    controller,
    ViewClass,
    template: template || route._topLevelViewTemplate
  };

  let Component;
  //if (isEnabled('ember-routing-routable-components')) {
    let componentName = options && options.component || namePassed && name || route.componentName || name;
    let componentLookup = owner.lookup('component-lookup:main');
    Component = componentLookup.lookupFactory(componentName);
    let isGlimmerComponent = Component && Component.proto().isGlimmerComponent;
    if (!template && !ViewClass && Component && isGlimmerComponent) {
      renderOptions.Component = Component;
      renderOptions.ViewClass = undefined;
      renderOptions.attrs = { model: get(controller, 'model') };
    }
  //}

  if (!ViewClass && !template && !Component) {
    assert(`Could not find "${name}" template, view, or component.`, isDefaultRender);
    if (LOG_VIEW_LOOKUPS) {
      var fullName = `template:${name}`;
      info(`Could not find "${name}" template or view. Nothing will be rendered`, { fullName: fullName });
    }
  }

  return renderOptions;
}

export function patchRoute() {
  Ember.Route.reopen({
    render(_name, options) {
        assert('The name in the given arguments is undefined', arguments.length > 0 ? !isNone(arguments[0]) : true);

        var namePassed = typeof _name === 'string' && !!_name;
        var isDefaultRender = arguments.length === 0 || isEmpty(arguments[0]);
        var name;

        if (typeof _name === 'object' && !options) {
          name = this.routeName;
          options = _name;
        } else {
          name = _name;
        }

        var renderOptions = buildRenderOptions(this, namePassed, isDefaultRender, name, options);
        this.connections.push(renderOptions);
        run.once(this.router, '_setOutlets');
    }
  });
}
