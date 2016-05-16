import Ember from 'ember';
const { get, getOwner, Logger: { info } } = Ember;
var require = Ember.__loader.require;
var OutletKeyword = require('ember-htmlbars/keywords/outlet').default;
var ViewNodeManager = require('ember-htmlbars/node-managers/view-node-manager').default;

function render(renderNode, env, scope, params, hash, template, inverse, visitor) {
  var state = renderNode.getState();
  var parentView = env.view;
  var outletState = state.outletState;
  var toRender = outletState.render;
  var namespace = env.owner.lookup('application:main');
  var LOG_VIEW_LOOKUPS = get(namespace, 'LOG_VIEW_LOOKUPS');

  var ViewClass = outletState.render.ViewClass;

  if (!state.hasParentOutlet && !ViewClass) {
    ViewClass = env.owner._lookupFactory('view:toplevel');
  }

  var Component;

  Component = outletState.render.Component;

  var options;
  var attrs = {};
  if (Component) {
    options = {
      component: Component
    };
    attrs = toRender.attrs;
  } else {
    options = {
      component: ViewClass,
      self: toRender.controller,
      createOptions: {
        controller: toRender.controller
      }
    };

    template = template || toRender.template && toRender.template.raw;

    if (LOG_VIEW_LOOKUPS && ViewClass) {
      info('Rendering ' + toRender.name + ' with ' + ViewClass, { fullName: 'view:' + toRender.name });
    }
  }

  if (state.manager) {
    state.manager.destroy();
    state.manager = null;
  }

  var nodeManager = ViewNodeManager.create(renderNode, env, attrs, options, parentView, null, null, template);
  state.manager = nodeManager;

  nodeManager.render(env, hash, visitor);
}


export function patchOutletKeyword() {
  OutletKeyword.render = render;
}
