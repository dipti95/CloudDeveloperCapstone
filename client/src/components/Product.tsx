import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Form
} from 'semantic-ui-react'

import {
  createProduct,
  deleteProduct,
  getProducts,
  patchProduct
} from '../api/product-api'
import Auth from '../auth/Auth'
import { Product } from '../types/Product'

interface ProductsProps {
  auth: Auth
  history: History
}

interface ProductsState {
  products: Product[]
  newProductName: string
  category: string
  loadingProducts: boolean
}

export class Products extends React.PureComponent<
  ProductsProps,
  ProductsState
> {
  state: ProductsState = {
    products: [],
    newProductName: '',
    category: '',
    loadingProducts: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newProductName: event.target.value })
  }
  handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ category: event.target.value })
  }

  onEditButtonClick = (productId: string) => {
    this.props.history.push(`/products/${productId}/edit`)
  }

  onProductCreate = async () => {
    try {
      const bestBefore = this.calculateDueDate()
      const newProduct = await createProduct(this.props.auth.getIdToken(), {
        name: this.state.newProductName,
        category: this.state.category,
        bestBefore
      })

      this.setState({
        products: [...this.state.products, newProduct],
        newProductName: '',
        category: ''
      })
    } catch {
      alert('Product creation failed')
    }
  }

  onProductDelete = async (productId: string) => {
    try {
      await deleteProduct(this.props.auth.getIdToken(), productId)
      this.setState({
        products: this.state.products.filter(
          (product) => product.productId !== productId
        )
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onProductCheck = async (pos: number) => {
    try {
      const product = this.state.products[pos]
      await patchProduct(this.props.auth.getIdToken(), product.productId, {
        name: product.name,
        bestBefore: product.bestBefore,
        sold: !product.sold
      })
      this.setState({
        products: update(this.state.products, {
          [pos]: { sold: { $set: !product.sold } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const products = await getProducts(this.props.auth.getIdToken())
      this.setState({
        products,
        loadingProducts: false
      })
    } catch (e) {
      alert(`Failed to fetch products: ${e}`)
    }
  }

  render() {
    return (
      <div>
        <Header
          as="h1"
          style={{
            color: 'DodgerBlue',
            padding: '40px',
            fontFamily: 'Arial',
            textAlign: 'center',

            textDecoration: 'underline black'
          }}
        >
          ALL PRODUCTS
        </Header>

        {this.renderCreateTodoInput()}

        {this.renderProducts()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Form
            onSubmit={this.onProductCreate}
            style={{
              border: 'solid Black',

              marginRight: '700px'
            }}
          >
            <div style={{}}>
              <div>
                <label>ProductName</label>
              </div>
              <div>
                <Input type="text" onChange={this.handleNameChange} />
              </div>
              <div>
                <label>Category</label>
              </div>
              <div>
                <Input type="text" onChange={this.handleCategoryChange} />
              </div>
            </div>
            <div>
              <Button
                style={{ color: 'red', backgroundColor: 'lightblue' }}
                type="submit"
              >
                CreateProduct
              </Button>
            </div>
          </Form>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderProducts() {
    if (this.state.loadingProducts) {
      return this.renderLoading()
    }

    return this.renderProductsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderProductsList() {
    return (
      <Grid padded>
        {this.state.products.map((product, pos) => {
          return (
            <Grid.Row
              key={product.productId}
              style={{
                // color: 'DodgerBlue',
                padding: '40px',
                fontFamily: 'Arial',
                border: 'solid black'
                // textAlign: 'center'
              }}
            >
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onProductCheck(pos)}
                  checked={product.sold}
                />
              </Grid.Column>
              <div style={{}}>
                <Grid.Column width={10} verticalAlign="middle">
                  Product: {product.name}
                </Grid.Column>
                <Grid.Column width={10} verticalAlign="middle">
                  ProductCategory: {product.category}
                </Grid.Column>
                <Grid.Column width={3} floated="right">
                  {product.bestBefore}
                </Grid.Column>
              </div>
              {product.attachmentUrl && (
                <Image src={product.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(product.productId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onProductDelete(product.productId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {/* {product.attachmentUrl && (
                <Image src={product.attachmentUrl} size="small" wrapped />
              )} */}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
