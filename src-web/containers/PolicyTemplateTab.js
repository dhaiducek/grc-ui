/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict'

import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import resources from '../../lib/shared/resources'
import PolicyTemplates from '../components/common/PolicyTemplates'
import { Notification, Loading } from 'carbon-components-react'
import msgs from '../../nls/platform.properties'

resources(() => {
  require('../../scss/policy-yaml-tab.scss')
})

class PolicyTemplateTab extends React.Component{
  constructor(props) {
    super(props)
  }

  render() {
    const { loading, error, resourceType, params, staticResourceData, items } = this.props
    if (error) {
      return <Notification
        title=''
        className='persistent'
        subtitle={msgs.get(error, this.context.locale)}
        kind='error' />
    } else if (loading && items === undefined) {
      return <Loading className='resource-detail-content-spinner' />
    } else{
      const item = items[0]
      return <PolicyTemplates resourceType={resourceType} params={params} staticResourceData={staticResourceData} resourceData={item} className='compliance-templates' headerKey={'table.header.complianceTemplate'} editable={true} />
    }
  }

}

PolicyTemplateTab.contextTypes = {
  locale: PropTypes.string
}

PolicyTemplateTab.propTypes = {
  error: PropTypes.any,
  items: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
    PropTypes.array
  ]),
  loading: PropTypes.bool,
  params: PropTypes.object,
  resourceType: PropTypes.object,
  staticResourceData: PropTypes.object,
}

const mapStateToProps = (state) => {
  const {resourceToolbar: {activeFilters}} = state
  return { activeFilters }
}

export default withRouter( connect(mapStateToProps) (PolicyTemplateTab))
