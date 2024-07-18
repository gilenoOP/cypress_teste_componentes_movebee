/// <reference types='Cypress' />

import React from 'react'
import ZipFinder from './ZipFinder'

describe('<ZipFinder />', () => {
  beforeEach(() => {
    cy.mount(<ZipFinder />)
    cy.viewport(1280, 1080)
    cy.get('[data-cy=inputCep]').as('inputZipcode')
    cy.get('[data-cy=submitCep]').as('submitZipcode')
  });

  it('Search zipcode without data', () => {
    cy.get('@submitZipcode')
      .should('be.visible')
      .click()
    cy.get('#swal2-title')
      .should('be.visible')
      .should('have.text', 'Preencha algum CEP')
    cy.get('.swal2-confirm')
      .should('be.visible')
      .click()
    cy.get('.swal2-popup')
      .should('not.exist')
    //Colocar esse cenário para executar primeiro com o sweetalert2 está causando problemas. Mesmo solicitando o fechamento da popup, o outro teste está falhando porque o cypress não está tendo tempo de fechá-lo antes do outro teste começar. Coloquei o wait abaixo para dar o tempo de fechamento. Também poderia ter colocado o teste para executar por último.
    cy.wait(200)
  })

  it('Search zipcode with numbers and letters', () => {
    const address = { zipcode : '25525-4aa' }
    cy.zipFind(address)
    cy.get('[data-cy="notice"]')
      .should('be.visible')
      .should('have.text', 'CEP no formato inválido.')
  })

  it('Search zipcode with invalid format', () => {
    const address = { zipcode: '255254801'}
    cy.zipFind(address)
    cy.get('[data-cy="notice"]')
      .should('be.visible')
      .should('have.text', 'CEP no formato inválido.')
  })

  it('Search zipcode outside the coverage area', () => {
    const address = { zipcode: '06150000' }
    cy.zipFind(address)
    cy.get('[data-cy=notice]')
      .should('be.visible')
      .should('have.text', 'No momento não atendemos essa região.')
  })

  it('Search zipcode', () => {
    const address = {
      street: 'Rua Joaquim Floriano',
      district: 'Itaim Bibi',
      city: 'São Paulo/SP',
      zipcode: '04534-011'
    }

    cy.zipFind(address)

    cy.get('[data-cy="logradouro"]')
      .should('be.visible')
      .should('have.text', address.street)
    cy.get('[data-cy="bairro"]')
      .should('be.visible')
      .should('have.text', address.district)
    cy.get('[data-cy="cidade_uf"]')
      .should('be.visible')
      .should('have.text', address.city)
    cy.get('[data-cy="cep"]')
      .should('be.visible')
      .should('have.text', address.zipcode)
  })
})

//O Custom command zipFind recebe sempre o address e já vem por padrão com o mock = false. Se o usuário chamar a custom command com true, o bloco abaixo simula (mocka) a requisição de consulta de cep, caso a api não esteja desenvolvida ainda, fora do ar, etc, trazendo sempre o que está definido no bloco. Basta saber a estrutura do body que a api usa ou vai usar.
Cypress.Commands.add('zipFind', (address, mock = false) => {
  if (mock) {
    cy.intercept('GET', '/zipcode/*', {
      statusCode: 200,
      body: {
        cep: address.zipcode,
        logradouro: address.street,
        cidade_uf: address.city,
        bairro: address.district
      }
    }).as('getZipcode')
  }
  cy.get('@inputZipcode')
    .should('be.visible')
    .type(address.zipcode)
  cy.get('@submitZipcode')
    .should('be.visible')
    .click()
  if (mock) {
    cy.wait('@getZipcode')
  }
})