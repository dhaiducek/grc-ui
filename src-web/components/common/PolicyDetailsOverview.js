/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict'

import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Notification, Loading } from 'carbon-components-react'
import { connect } from 'react-redux'
import { updateResourceToolbar } from '../../actions/common'
import msgs from '../../../nls/platform.properties'
import resources from '../../../lib/shared/resources'
import _ from 'lodash'
import DetailsModule from './DetailsModule'
import SimpleTable from './SimpleTable'
import ResourceTableModule from './ResourceTableModuleFromProps'
import StructuredListModule from '../../components/common/StructuredListModuleWithActions'


resources(() => {
  require('../../../scss/policy-details-overview.scss')
})

class PolicyDetailsOverview extends React.PureComponent{
  constructor(props) {
    super(props)
  }

  static propTypes = {
    error: PropTypes.any,
    item: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
      PropTypes.array
    ]),
    loading: PropTypes.any,
    location: PropTypes.object,
    // params: PropTypes.object,
    refreshControl: PropTypes.object,
    resourceType: PropTypes.object,
    staticResourceData: PropTypes.object,
    updateResourceToolbar: PropTypes.func,
  }

  static contextTypes = {
    locale: PropTypes.string
  }

  getTemplates = (spec = {}, templateType = '') => {
    const templates = []
    Object.entries(spec || []).forEach(([key, value]) => {
      if (key.endsWith(`${templateType}-templates`)) {
        value.forEach(item => templates.push({ ...item, templateType: key }))
      }
    })
    return templates
  }

  getClusterStatus = (item) => {
    const rawStatus =  _.get(item, 'complianceStatus', '-')
    const status = {}
    _.forEach(rawStatus, (value) => {
      const clusterNamespace = _.get(value, 'clusterNamespace')
      const compliant = _.get(value, 'compliant', '-')
      status[clusterNamespace] = compliant
    })
    return status
  }

  componentWillReceiveProps(nextProps) {
    const {refreshControl, item, updateResourceToolbar} = nextProps
    if (!_.isEqual(refreshControl, this.props.refreshControl) ||
        !_.isEqual(item, this.props.item)) {
      updateResourceToolbar(refreshControl, {})
    }
  }

  render() {
    const {staticResourceData, resourceType, error, loading, location} = this.props
    let {item} = this.props

    if(error) {
      return <Notification
        title=''
        className='persistent'
        subtitle={msgs.get(error, this.context.locale)}
        kind='error' />
    } else if (loading) {
      return <Loading withOverlay={false} className='content-spinner' />
    } else {
      item = item[0]
    }

    const clusterStatus = this.getClusterStatus(item)

    const modulesSecond = [<StructuredListModule key='placementPolicies' rowsKey='placementPoliciesKeys' actions={['table.actions.edit']} staticResourceData={staticResourceData} clusterStatus={clusterStatus} location={location} resourceType={resourceType} textEditButton left />,
      <StructuredListModule key='placementBindings' rowsKey='placementBindingKeys' actions={['table.actions.edit']} staticResourceData={staticResourceData} resourceType={resourceType} textEditButton right />,]
    const modulesBottom = []
    const templates = this.getTemplates(item.raw.spec)
    let templateType

    if (templates){
      const roleTemplates = []
      const policyTemplates = []
      const objectTemplates = []
      for( const template of templates){
        templateType = template.templateType
        switch( templateType ){
        case 'role-templates':
          roleTemplates.push(template)
          break
        case 'policy-templates':
          policyTemplates.push(template)
          break
        case 'object-templates':
          objectTemplates.push(template)
          break
        default:
          break
        }
      }

      const tableResource = {}
      tableResource['role-templates'] = roleTemplates
      tableResource['policy-templates'] = policyTemplates
      tableResource['object-templates'] = objectTemplates
      if(!_.isEmpty(roleTemplates)){
        _.forEach(roleTemplates,(item) => {
          item.id = item.metadata.name
          const subItems = []
          _.forEach(item.rules, (rule) => {
            subItems.push({
              id: _.get(rule, 'complianceType','-'),
              cells: [
                JSON.stringify(_.get(rule, 'complianceType','-')).replace(/\[|\]|"/g, ''),
                JSON.stringify(_.get(rule, 'policyRule.apiGroups','-')).replace(/\[|\]|"/g, ''),
                JSON.stringify(_.get(rule, 'policyRule.resources','-')).replace(/\[|\]|"/g, ''),
                JSON.stringify(_.get(rule, 'policyRule.verbs','-')).replace(/\[|\]|"/g, ''),
              ]
            })
          })
          item.subItems = subItems
        })
        modulesBottom.push(
          <div className='vertical-expend overview-content-bottom' key='role-temp-container'>
            <h5 className='section-title'>Role Templates</h5>
            <div className='overview-content-bottom'>
              {React.createElement(SimpleTable,
                {
                  headerRows: ['', ..._.map(staticResourceData.roleTemplates.tableKeys, 'msgKey')],
                  data: roleTemplates,
                  rows: staticResourceData.roleTemplates.rows,
                  subHeaders: staticResourceData.roleTemplates.subHeaders,
                  listSubItems: true,
                  emptyColFront: 1
                })}
            </div>
          </div>
        )
      }
      if(!_.isEmpty(policyTemplates)){
        modulesBottom.push(
          <div className='vertical-expend overview-content-bottom' key='policy-temp-container'>
            <h5 className='section-title'>Policy Templates</h5>
            <div className='overview-content-bottom'>
              {React.createElement(ResourceTableModule,
                {
                  key: templateType,
                  definitionsKey: 'policyTemplates',
                  staticResourceData: staticResourceData,
                  resourceType: resourceType,
                  resourceData: tableResource,
                  showModuleHeader: false,
                  showSearch: false,
                  showPagination:false
                })}
            </div>
          </div>
        )
      }
      if(!_.isEmpty(objectTemplates)){
        modulesBottom.push(
          <div className='vertical-expend overview-content-bottom' key='obj-temp-container'>
            <h5 className='section-title'>Object Templates</h5>
            <div className='overview-content-bottom'>
              {React.createElement(ResourceTableModule,
                {
                  key: templateType,
                  definitionsKey: 'objectTemplates',
                  staticResourceData: staticResourceData,
                  resourceType: resourceType,
                  resourceData: tableResource,
                  showModuleHeader: false,
                  showSearch: false,
                  showPagination:false
                })}
            </div>
          </div>
        )
      }
    }

    return (
      <div className='overview-content'>
        <div className='vertical-expend'>
          <h5 className='section-title'>Policy Details</h5>
          <DetailsModule
            numRows = {3}
            numColumns = {3}
            listData = {item}
            listItem = {staticResourceData.detailKeys.rows}
            title = {staticResourceData.detailKeys.title}
            showHeader={false}
          />
        </div>

        <div className='vertical-expend'>
          <h5 className='section-title'>Placement</h5>
          {modulesSecond.length > 0 &&
          <div className='overview-content-second'>
            <div className='overview-content-second-left'>
              {React.cloneElement(modulesSecond[0], { ...staticResourceData.placementPolicyKeys.detailKeys, data:item.placementPolicies[0] })}
            </div>
            <div className='overview-content-second-left'>
              {React.cloneElement(modulesSecond[1], { ...staticResourceData.placementBindingKeys.detailKeys, data:item.placementBindings[0] })}
            </div>
          </div>}
        </div>

        {modulesBottom}

      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const {resourceToolbar: {activeFilters}} = state
  return { activeFilters }
}

const mapDispatchToProps = dispatch => {
  return {
    updateResourceToolbar: (refreshControl) => dispatch(updateResourceToolbar(refreshControl, {})),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PolicyDetailsOverview))