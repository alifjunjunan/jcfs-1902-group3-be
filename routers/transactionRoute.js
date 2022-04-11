const router = require('express').Router()
const { transactionController } = require('../controllers')
const { readToken } = require('../supports/enkripsi')

router.post('/carts', readToken, transactionController.addCart)
router.patch('/carts/:idcart', readToken, transactionController.updateQtyCart)
router.get('/carts', readToken, transactionController.getCart)
router.delete('/carts/:idcart', readToken, transactionController.deleteCart)

module.exports = router